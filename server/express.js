const express = require('express');
const indexRoute = require('./routes');

function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use('/', indexRoute);

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log('Node.js version:', process.version);
  });
}

module.exports = startServer;
