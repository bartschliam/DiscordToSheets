const { splitAndSend } = require('../utils/helpers');

module.exports = {
  name: 'rolemissing',
  description: 'List members with a role who are not in the provided username list',
  async execute(message, client) {
    const guild = client.guilds.cache.get('412572204954288128');
    if (!guild) {
      console.log('Server Clash of Clans Events not found. Skipping.');
      return;
    }

    if (message.author.bot) return;

    const isLiam = message.author.username === 'liamtitan';
    if (!isLiam) {
      console.log(`Unauthorized !rolemissing attempt by ${message.author.tag}`);
      return;
    }

    const lines = message.content.split('\n').slice(1);
    if (lines.length < 2) {
      console.log('Invalid !rolemissing input: not enough lines');
      return message.reply('Include usernames and a role name or ID at the end.');
    }

    const roleIdentifier = lines.pop().trim();
    const stripFormatting = (value) =>
      value
        .normalize('NFKC')
        .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u2060]/g, '')
        .replace(/\p{Cf}/gu, '')
        .trim()
        .toLowerCase();
    const usernames = lines.map((line) => line.trim()).filter(Boolean);

    const role = message.guild.roles.cache.find(
      (r) => r.name === roleIdentifier || r.id === roleIdentifier
    );

    if (!role) {
      return message.reply(`Role "${roleIdentifier}" not found.`);
    }

    const provided = new Set(usernames.map((name) => stripFormatting(name)));
    const members = await message.guild.members.fetch();

    const missing = members
      .filter((member) => member.roles.cache.has(role.id))
      .filter((member) => !provided.has(stripFormatting(member.user.username)))
      .map((member) => member.user.tag || member.user.username);

    if (missing.length === 0) {
      return message.reply(`✅ Everyone with "${role.name}" is in your list.`);
    }

    const header = `❌ ${missing.length} member(s) have "${role.name}" but are not in your list:`;
    splitAndSend(message.channel, `${header}\n${missing.join('\n')}`);
  },
};