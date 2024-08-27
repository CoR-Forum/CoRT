const mysql = require('mysql');

require('dotenv').config();
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = process.env.DB_PORT;

const connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT,
  });

connection.connect((err) => {
if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
}
console.log('Connected to the database as id ' + connection.threadId);
});
  
module.exports = connection;