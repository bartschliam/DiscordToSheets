require('dotenv').config();
const startServer = require('./server/express');
const client = require('./bot/client');
require('./bot/events')(client);
require('./bot/scheduler')(client);

startServer();
client.login(process.env.DISCORD_BOT_TOKEN);
