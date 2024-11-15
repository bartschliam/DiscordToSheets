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

const CHANNEL_ID = process.env.CHANNEL_ID;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const REGEX_PATTERN = new RegExp(process.env.REGEX_PATTERN);
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

async function addToSheet(message) {
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
    const sheet = doc.sheetsByIndex[0];
    message.content = message.content.replace(/\?ask\s*/, "").trim();
    console.log("Processed message content:", message.content);

    // Add the message to the sheet
    await sheet.addRow({
      Timestamp: message.createdAt.toISOString(),
      Author: message.author.tag,
      Content: message.content,
    });

    console.log("Message added to sheet successfully:", message.content);
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
    message.channel.id === CHANNEL_ID &&
    REGEX_PATTERN.test(message.content)
  ) {
    try {
      await addToSheet(message);
      console.log("Message added to sheet successfully");
      await message.react("✅"); // Use any emoji you prefer
    } catch (error) {
      console.error("Error adding message to sheet:", error);
      await message.react("❌"); // React with a different emoji to indicate failure
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
