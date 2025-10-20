console.log("Node.js version:", process.version);


require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const schedule = require("node-schedule");
const { AttachmentBuilder } = require("discord.js");


// Setup Express server for Render
const app = express();
const PORT = process.env.PORT || 3000; // Use the PORT provided by Render

app.get("/", (req, res) => {
  const year = (10000 + new Date().getFullYear()).toString().replace(/^(\d{2})(\d{3})$/, '$1 $2');
  const dateFormat = 'yyyy/mm/dd';
  
  res.send(`
    <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
      <h2>Discord bot is running!</h2>
      <p>The correct date format is <strong>${dateFormat}</strong></p>
      <p>The current year is <strong>${year}</strong></p>
      <p>The correct system is <strong>metric</strong>, not imperial.</p>
      <p>That means:</p>
      <ul style="display: inline-block; text-align: left;">
        <li>Temperature → Celsius (°C)</li>
        <li>Distance → Kilometers (km)</li>
        <li>Weight → Kilograms (kg)</li>
        <li>Volume → Liters (L)</li>
      </ul>
    </div>
  `);

});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const CHANNEL_ID_RTC = process.env.CHANNEL_ID_RTC;
const CHANNEL_ID_CLAN_CHAT = process.env.CHANNEL_ID_CLAN_CHAT;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const REGEX_PATTERN = new RegExp(process.env.REGEX_PATTERN, 'is');
const REGEX_PATTERN_TRIVIA = new RegExp(process.env.REGEX_PATTERN_TRIVIA);
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];
const base64EncodedServiceAccount = process.env.BASE64_ENCODED_SERVICE_ACCOUNT;
const decodedServiceAccount = Buffer.from(
  base64EncodedServiceAccount,
  "base64"
).toString("utf-8");
const credentials = JSON.parse(decodedServiceAccount);
const serviceAccountAuth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: SCOPES,
});

let isAddingToSheet = false;
let queue = 0;
const recentQuestions = new Set(); // Stores recent questions to prevent duplicates

async function addToSheet(message, channel_id, regex) {
  const questionText = message.content.trim().toLowerCase();
  // Check if the question was recently asked
  if (recentQuestions.has(questionText)) {
    console.warn("Duplicate question detected, skipping:", questionText);
    return; // Exit without adding to sheet
  }

  // Add to recent questions to prevent duplicates
  recentQuestions.add(questionText);
  // Set a timeout to remove the question after x minutes
  setTimeout(() => recentQuestions.delete(questionText), 7200000); // 120 minutes

  // Prevent double execution by checking if it's already adding to the sheet
  while (isAddingToSheet) {
    console.warn("Attempted to add to sheet while already in process.");
    queue += 1;
    await new Promise(resolve => setTimeout(resolve, 1000 * queue));
  }

  isAddingToSheet = true;

  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

    // Load the spreadsheet
    await doc.loadInfo();
    console.log("Spreadsheet loaded:", doc.title);

    // Select the first sheet
    let sheet;
    if (channel_id === CHANNEL_ID_RTC) {
      sheet = doc.sheetsByIndex[0];
    } else if (channel_id === CHANNEL_ID_CLAN_CHAT) {
      sheet = doc.sheetsByIndex[1];
    }
    let dynamicPattern;
    if (regex === REGEX_PATTERN) {
      dynamicPattern = new RegExp(
        `^\\s*\\${REGEX_PATTERN.source.slice(5, 9)}\\s*`,
        "i"
      );
    } else if (regex === REGEX_PATTERN_TRIVIA) {
      dynamicPattern = new RegExp(
        `^\\s*\\${REGEX_PATTERN_TRIVIA.source.slice(5, 10)}\\s*`,
        "i"
      );
    }
    message.content = message.content.replace(dynamicPattern, "").trim();
    console.log("Processed message content:", message.content);
    if (message.content.length > 0) {
      // Add the message to the sheet
      if (regex === REGEX_PATTERN) {
        await sheet.addRow({
          Timestamp: message.createdAt.toISOString(),
          Author: message.author.tag,
          Content: message.content,
        });
      } else if (regex === REGEX_PATTERN_TRIVIA) {
        await sheet.addRow({
          Timestamp: message.createdAt.toISOString(),
          Author: message.author.tag,
          Trivia: message.content,
        });
      }
      console.log("Message added to sheet successfully:", message.content);
    }
  } catch (error) {
    console.error("Error adding message to sheet:", error);
  } finally {
    // Reset the lock regardless of success or failure
    isAddingToSheet = false;
    queue -= 1;
  }
}

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const now = new Date();
  console.log("Bot started at:", now.toISOString());

  // Run at  on the 25th of every month
  schedule.scheduleJob("1 0 25 * *", async () => {
    try {
      // Ensure we're in the correct server
      const guild = client.guilds.cache.get("723317259736711189");
      if (!guild) {
        console.log("Server Titans not found. Skipping.");
        return;
      }
      else {
        console.log('Authorized')
      }

      // Fetch the channel
      const channel = guild.channels.cache.get("1187305229193064590");
      if (!channel) {
        console.log("Channel not found. Skipping.");
        return;
      }

      // Build the attachment
      const attachment = new AttachmentBuilder("25_reminder.png");

      // Send the message with the image
      await channel.send({
        content: "Don't forget to claim this free stuff: https://store.supercell.com/clashofclans",
        files: [attachment],
      });

      console.log("Message with image sent successfully.");
    } catch (error) {
      console.error("Error in scheduled job:", error);
    }
  });
});

client.on("messageCreate", async (message) => {
  // Ensure we're in the correct server
  const guild = client.guilds.cache.get("236523452230533121");
  if (!guild) {
    console.log("Server Clash of Clans not found. Skipping.");
    return;
  }

  if (
    (message.channel.id === CHANNEL_ID_RTC ||
      message.channel.id === CHANNEL_ID_CLAN_CHAT) &&
    REGEX_PATTERN.test(message.content)
  ) {
    try {
      await addToSheet(message, message.channel.id, REGEX_PATTERN);
      const fetchedMessage = await message.channel.messages
        .fetch(message.id)
        .catch(() => null);

      if (fetchedMessage) {
        await fetchedMessage.react("✅"); // React with the emoji if the message still exists
      } else {
        console.log("Message no longer exists, skipping reaction.");
      }
    } catch (error) {
      console.error("Error adding message to sheet:", error);
      await message.react("❌"); // React with a different emoji to indicate failure
    }
  } else if (
    message.channel.id === CHANNEL_ID_RTC &&
    REGEX_PATTERN_TRIVIA.test(message.content)
  ) {
    try {
      await addToSheet(message, message.channel.id, REGEX_PATTERN_TRIVIA);
      const fetchedMessage = await message.channel.messages
        .fetch(message.id)
        .catch(() => null);

      if (fetchedMessage) {
        await fetchedMessage.react("✅"); // React with the emoji if the message still exists
      } else {
        console.log("Message no longer exists, skipping reaction.");
      }
    } catch (error) {
      console.error("Error adding message to sheet:", error);
      await message.react("❌"); // React with a different emoji to indicate failure
    }
  }
});

// // Role Leaderboard
// client.on("messageCreate", async (message) => {
//   // Ensure we're in the correct server
//   const guild = client.guilds.cache.get("412572204954288128");
//   if (!guild) {
//     console.log("Server Clash of Clans Events not found. Skipping.");
//     return;
//   }

//   const isLiam = message.author.username === 'liamtitan';

//   if (message.content.startsWith("!roleleaderboard") & isLiam) {
//     console.log('Authorized')
//     const members = await fetchAllMembers(message.guild);
//     const number = 50;

//     const roleCounts = members
//       .map((member) => {
//         // Filter out the @everyone role
//         const roles = member.roles.cache
//           .filter((r) => r.name !== "@everyone")
//           .map((r) => r.name);

//         return {
//           name: member.user.tag,
//           count: roles.length,
//           roles: roles,
//         };
//       })
//       .sort((a, b) => b.count - a.count)
//       .slice(0, number);

//     if (roleCounts.length === 0) {
//       return message.reply("No users found with roles.");
//     }

//     const leaderboard = roleCounts
//       .map((m, i) => {
//         const roleList = m.roles.join("\n, "); // Limit to first 5 roles to avoid message overflow
//         return `**${i + 1}.** ${m.name}: ${m.count} roles (${roleList}})`;
//       })
//       .join("\n");

//     // message.channel.send(`**Top ${number} Members with Most Roles:**\n${leaderboard}`);
//     splitAndSend(message.channel, leaderboard);

//   }
// });

function splitAndSend(channel, content) {
  const maxLength = 2000;
  const lines = content.split('\n');
  let chunk = '';

  for (const line of lines) {
    if ((chunk + line + '\n').length > maxLength) {
      channel.send(chunk);
      chunk = '';
    }
    chunk += line + '\n';
  }

  if (chunk.length > 0) {
    channel.send(chunk);
  }
}

async function fetchAllMembers(guild) {
  let allMembers = new Map(); // Store members uniquely
  let lastMemberId = undefined; // Used for pagination
  let limit = 1000; // Max per request

  while (true) {
    const members = await guild.members.list({
      limit,
      after: lastMemberId, // Fetch members **after** this ID
    });

    if (members.size === 0) break; // Stop when no more members

    members.forEach((member) => allMembers.set(member.id, member));
    lastMemberId = [...members.keys()].pop(); // Get last fetched member ID
  }

  return Array.from(allMembers.values()); // Convert map back to array
}

// // Mass Assign Roles
// client.on('messageCreate', async (message) => {
//   // Ensure we're in the correct server
//   const guild = client.guilds.cache.get("412572204954288128");
//   if (!guild) {
//     console.log("Server Clash of Clans Events not found. Skipping.");
//     return;
//   }

//   if (!message.content.startsWith('!massassign') || message.author.bot) return;

//   const isLiam = message.author.username === 'liamtitan';

//   if (!isLiam) {
//     console.log(`Unauthorized !massassign attempt by ${message.author.tag}`);
//     return;
//   }

//   const lines = message.content.split('\n').slice(1); // skip the command itself
//   if (lines.length < 2) {
//     console.log('Invalid !massassign input: not enough lines');
//     return message.reply('Include usernames and a role name or ID at the end.');
//   }

//   const roleIdentifier = lines.pop().trim(); // Last line = role name or ID
//   const usernames = lines.map(line => line.trim()).filter(Boolean);

//   const role = message.guild.roles.cache.find(
//     r => r.name === roleIdentifier || r.id === roleIdentifier
//   );

//   if (!role) {
//     return message.reply(`Role "${roleIdentifier}" not found.`);
//   }

//   let added = 0;
//   let notFound = [];

//   for (const username of usernames) {
//     const members = await message.guild.members.fetch();
//     const member = members.find(
//       m => m.user.username === username
//     );

//     if (member) {
//       try {
//         await member.roles.add(role);
//         added++;
//         console.log(`✅ Added ${role.name} to ${username}`);
//       } catch (err) {
//         console.error(`❌ Failed to assign role to ${username}:`, err);
//         notFound.push(`${username} (error)`);
//       }
//     } else {
//       console.log(`❌ Username not found: ${username}`);
//       notFound.push(username);
//     }
//   }

//   message.reply(
//     `✅ Assigned "${role.name}" to ${added} user(s).\n❌ ${notFound.length} not found:\n${notFound.join(', ')}`
//   );
// });


client.login(process.env.DISCORD_BOT_TOKEN);
