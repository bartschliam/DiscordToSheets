const { fetchAllMembers, splitAndSend } = require('../utils/helpers');

module.exports = {
  name: 'roleleaderboard',
  description: 'Show the top members with the most roles',
  async execute(message, client) {
    const guild = client.guilds.cache.get('412572204954288128');
    if (!guild) {
      console.log('Server Clash of Clans Events not found. Skipping.');
      return;
    }

    const isLiam = message.author.username === 'liamtitan';
    if (!isLiam) return;

    console.log('Authorized');
    const members = await fetchAllMembers(message.guild);
    const number = 50;

    const roleCounts = members
      .map((member) => {
        const roles = member.roles.cache
          .filter((r) => r.name !== '@everyone')
          .map((r) => r.name);

        return {
          name: member.user.tag,
          count: roles.length,
          roles,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, number);

    if (roleCounts.length === 0) {
      return message.reply('No users found with roles.');
    }

    const leaderboard = roleCounts
      .map((m, i) => {
        const roleList = m.roles.join(', ');
        return `**${i + 1}.** ${m.name}: ${m.count} roles (${roleList})`;
      })
      .join('\n');

    splitAndSend(message.channel, leaderboard);
  },
};
