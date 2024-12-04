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
const REGEX_PATTERN = new RegExp(process.env.REGEX_PATTERN);
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

async function addToSheet(message, channel_id, regex) {
  // Prevent double execution by checking if it's already adding to the sheet
  if (isAddingToSheet) {
    console.warn("Attempted to add to sheet while already in process.");
    return;
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
        `^\\s*\\${REGEX_PATTERN_TRIVIA.source.slice(5, 12)}\\s*`,
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

client.login(process.env.DISCORD_BOT_TOKEN);
