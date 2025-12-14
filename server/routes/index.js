const express = require('express');
const renderStatusPage = require('../views/statusPage');

const router = express.Router();

router.get('/', (req, res) => {
  res.send(renderStatusPage());
});

module.exports = router;
