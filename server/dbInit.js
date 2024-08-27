const mysql = require('mysql');
const logger = require('./winston');

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
    logger.error('Error connecting to database: ' + err);
    return;
}
logger.info('Connected to database ' + DB_NAME + ' on ' + DB_HOST + ':' + DB_PORT + ' as user ' + DB_USER);
});
  
module.exports = connection;