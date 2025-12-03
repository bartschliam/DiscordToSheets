module.exports = {
  name: 'massassign',
  description: 'Assign a role to multiple users by username',
  async execute(message, client) {
    const guild = client.guilds.cache.get('412572204954288128');
    if (!guild) {
      console.log('Server Clash of Clans Events not found. Skipping.');
      return;
    }

    if (message.author.bot) return;

    const isLiam = message.author.username === 'liamtitan';
    if (!isLiam) {
      console.log(`Unauthorized !massassign attempt by ${message.author.tag}`);
      return;
    }

    const lines = message.content.split('\n').slice(1);
    if (lines.length < 2) {
      console.log('Invalid !massassign input: not enough lines');
      return message.reply('Include usernames and a role name or ID at the end.');
    }

    const roleIdentifier = lines.pop().trim();
    const usernames = lines.map(line => line.trim()).filter(Boolean);

    const role = message.guild.roles.cache.find(
      r => r.name === roleIdentifier || r.id === roleIdentifier
    );

    if (!role) {
      return message.reply(`Role "${roleIdentifier}" not found.`);
    }

    let added = 0;
    const notFound = [];

    const members = await message.guild.members.fetch();

    for (const username of usernames) {
      const member = members.find(m => m.user.username === username);
      if (member) {
        try {
          await member.roles.add(role);
          added++;
          console.log(`✅ Added ${role.name} to ${username}`);
        } catch (err) {
          console.error(`❌ Failed to assign role to ${username}:`, err);
          notFound.push(`${username} (error)`);
        }
      } else {
        console.log(`❌ Username not found: ${username}`);
        notFound.push(username);
      }
    }

    message.reply(
      `✅ Assigned "${role.name}" to ${added} user(s).\n❌ ${notFound.length} not found:\n${notFound.join(', ')}`
    );
  },
};
