const schedule = require('node-schedule');
const { AttachmentBuilder } = require('discord.js');

module.exports = (client) => {
  client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    schedule.scheduleJob('1 0 25 * *', async () => {
      try {
        const guild = client.guilds.cache.get('723317259736711189');
        if (!guild) return console.log('Server Titans not found.');

        const channel = guild.channels.cache.get('1187305229193064590');
        if (!channel) return console.log('Channel not found.');

        const attachment = new AttachmentBuilder('25_reminder.png');
        await channel.send({
          content: "Don't forget to claim this free stuff: https://store.supercell.com/clashofclans",
          files: [attachment],
        });

        console.log('Reminder sent successfully.');
      } catch (err) {
        console.error('Error in scheduled job:', err);
      }
    });
  });
};
