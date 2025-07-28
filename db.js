// db.js
const { Pool } = require('pg');
require('dotenv').config();
console.log('⎈ DATABASE_URL=', process.env.DATABASE_URL);

// Use Railway's DATABASE_URL if available, otherwise fallback to local config
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      user:'postgres',
      password:'root',
      host:'localhost',
      port:5433,
      database:'mindsync'
    });

module.exports = {
	query: (text,params) => pool.query(text,params)
};
