const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'store_rating_db',
  password: 'Sukhad@17',
  port: 5432,
});

module.exports = pool;
