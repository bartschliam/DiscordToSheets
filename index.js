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

async function addToSheet(message) {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

  await doc.loadInfo(); // loads document properties and worksheets
  console.log(doc.title);
  const sheet = doc.sheetsByIndex[0];
  message.content = message.content.replace(/\?ask\s*/, "").trim();
  console.log(message.content);
  await sheet.addRow({
    Timestamp: message.createdAt.toISOString(),
    Author: message.author.tag,
    Content: message.content,
  });
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
