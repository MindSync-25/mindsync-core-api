// db.js
const { Pool } = require('pg');
require('dotenv').config();
console.log('⎈ POSTGRES_URL=', process.env.POSTGRES_URL);

const pool = new Pool({
  user:'postgres',
  password:'root',
  host:'localhost',
  port:5433,
  database:'mindsync'
});

module.exports = {
	query: (text,params) => pool.query(text,params)
};
