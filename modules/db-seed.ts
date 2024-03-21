const { Client } = require('pg');

const config = {
  database: 'webapp_dev',
};

module.exports = new Client(config);
