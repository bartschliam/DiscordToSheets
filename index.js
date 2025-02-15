require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

// Setup Express server for Render
const app = express();
const PORT = process.env.PORT || 3000; // Use the PORT provided by Render

app.get("/", (req, res) => {
  res.send("Discord bot is running!");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_ID_RTC = process.env.CHANNEL_ID_RTC;
const CHANNEL_ID_CLAN_CHAT = process.env.CHANNEL_ID_CLAN_CHAT;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const REGEX_PATTERN = new RegExp(process.env.REGEX_PATTERN, 'i');
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

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
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

// client.on("messageCreate", async (message) => {
//   if (message.content.startsWith("!roleleaderboard")) {
//     console.log(message.content);
//     const members = await fetchAllMembers(message.guild);
//     console.log(members)
//     const number = 50
//     const roleCounts = members
//       .map((member) => ({ name: member.user.tag, count: member.roles.cache.size - 1 })) // Subtracting 1 to exclude "@everyone"
//       .sort((a, b) => b.count - a.count) // Sort descending by role count
//       .slice(0, number); // Get top 10

//     if (roleCounts.length === 0) {
//       return message.reply("No users found with roles.");
//     }

//     const leaderboard = roleCounts
//       .map((m, i) => `**${i + 1}.** ${m.name}: ${m.count} roles`)
//       .join("\n");

//     message.channel.send(`**Top ${number} Members with Most Roles:**\n${leaderboard}`);
//   }
// });

// async function fetchAllMembers(guild) {
//   let allMembers = new Map(); // Store members uniquely
//   let lastMemberId = undefined; // Used for pagination
//   let limit = 1000; // Max per request

//   while (true) {
//     const members = await guild.members.list({
//       limit,
//       after: lastMemberId, // Fetch members **after** this ID
//     });

//     if (members.size === 0) break; // Stop when no more members

//     members.forEach((member) => allMembers.set(member.id, member));
//     lastMemberId = [...members.keys()].pop(); // Get last fetched member ID
//   }

//   return Array.from(allMembers.values()); // Convert map back to array
// }


client.login(process.env.DISCORD_BOT_TOKEN);
