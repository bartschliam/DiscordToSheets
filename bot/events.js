const fs = require('fs');
const path = require('path');
const { addToSheet } = require('./sheet');

module.exports = (client) => {
  const prefix = '!';
  const commands = new Map();
  const commandsPath = path.join(__dirname, 'commands');

  if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if (command && command.name && typeof command.execute === 'function') {
        commands.set(command.name.toLowerCase(), command);
      }
    }
  }

  const channels = {
    RTC: process.env.CHANNEL_ID_RTC,
    CLAN_CHAT: process.env.CHANNEL_ID_CLAN_CHAT,
  };
  const patterns = {
    REGEX_PATTERN: new RegExp(process.env.REGEX_PATTERN, 'is'),
    REGEX_PATTERN_TRIVIA: new RegExp(process.env.REGEX_PATTERN_TRIVIA),
  };

  client.on('messageCreate', async (message) => {
    const guild = client.guilds.cache.get('236523452230533121');
    if (!guild) return;

    if (!message.author.bot && message.content.startsWith(prefix)) {
      const [commandName] = message.content.slice(prefix.length).trim().split(/\s+/);
      const command = commands.get(commandName.toLowerCase());

      if (command) {
        try {
          await command.execute(message, client);
        } catch (err) {
          console.error(`Error running command ${commandName}:`, err);
          await message.reply('There was an error running that command.');
        }
      }
    }

    const match = [
      [channels.RTC, patterns.REGEX_PATTERN],
      [channels.CLAN_CHAT, patterns.REGEX_PATTERN],
      [channels.RTC, patterns.REGEX_PATTERN_TRIVIA],
    ].find(([id, regex]) => message.channel.id === id && regex.test(message.content));

    if (!match) return;

    const [channelId, regex] = match;
    try {
      await addToSheet(message, channelId, regex, channels, patterns);
      const msg = await message.channel.messages.fetch(message.id).catch(() => null);
      if (msg) await msg.react('✅');
    } catch (err) {
      console.error('Error adding message:', err);
      await message.react('❌');
    }
  });
};
