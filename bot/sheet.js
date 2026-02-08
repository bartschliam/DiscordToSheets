const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const decoded = Buffer.from(process.env.BASE64_ENCODED_SERVICE_ACCOUNT, 'base64').toString('utf-8');
const credentials = JSON.parse(decoded);

const auth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: SCOPES,
});

let isAddingToSheet = false;
let queue = 0;
const recentQuestions = new Set();

async function addToSheet(message, channel_id, regex, channels, patterns) {
  const questionText = message.content.trim().toLowerCase();
  if (recentQuestions.has(questionText)) {
    console.warn("Duplicate question detected, skipping:", questionText);
    // await message.reply('Hey, looks like that question was already asked.');
    return; // Exit without adding to sheet
  }
  recentQuestions.add(questionText);
  setTimeout(() => recentQuestions.delete(questionText), 7200000);

  while (isAddingToSheet) {
    console.warn("Attempted to add to sheet while already in process.");
    queue++;
    await new Promise((r) => setTimeout(r, 1000 * queue));
  }

  isAddingToSheet = true;

  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
    await doc.loadInfo();
    console.log("Spreadsheet loaded:", doc.title);

    let sheet = doc.sheetsByIndex[
      channel_id === channels.RTC ? 0 : channel_id === channels.CLAN_CHAT ? 1 : null
    ];

    // Strip the leading command token (e.g. !join, ?ask) so only the payload is stored.
    const commandPrefixPattern = /^\s*[!?][^\s]+\s*/i;
    message.content = message.content.replace(commandPrefixPattern, '').trim();
    console.log("Processed message content:", message.content);

    if (message.content.length > 0) {
      const row = {
        Timestamp: message.createdAt.toISOString(),
        Author: message.author.tag,
        [regex === patterns.REGEX_PATTERN ? 'Content' : 'Trivia']: message.content,
      };
      await sheet.addRow(row);
      console.log("Message added to sheet successfully:", message.content);
    }
  } catch (err) {
    console.error('Error adding to sheet:', err);
  } finally {
    isAddingToSheet = false;
    queue--;
  }
}

module.exports = { addToSheet };
