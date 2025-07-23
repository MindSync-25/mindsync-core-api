// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, 
  // e.g. "postgres://postgres:secret@localhost:5432/mindsync"
});

module.exports = pool;
