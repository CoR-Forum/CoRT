// this nodejs server will serve a rest api for the frontend to consume
// everything will be in one file for simplicity

const logger = require('./winston');

// Environment variables
require('dotenv').config();

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'http://localhost';
const API_PATH = process.env.API_PATH || '/api/v1';
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = process.env.DB_PORT;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM;
const SESSION_SECRET = process.env.SESSION_SECRET;

// MySQL Database
const db = require('./dbInit'); // Adjust the path as necessary

// check if database exists, if not create it
// if it exists, check if tables exist, if not create them
// users
db.query(`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_key VARCHAR(255),
  email_verification_expires TIMESTAMP,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  nickname VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  registration_key VARCHAR(255),
  registration_ip VARCHAR(255),
  active BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  last_ip VARCHAR(255),
  last_gdpr_export TIMESTAMP,
  password_reset_key VARCHAR(255),
  password_reset_expires TIMESTAMP,
  password_reset_ip VARCHAR(255)
)`, (err, result) => {
  if (err) {
    logger.error('Error creating users table:', err);
    throw err;
  }
  logger.info('Table users created or updated');
});

// characters
db.query(`CREATE TABLE IF NOT EXISTS characters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  realm VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  level INT NOT NULL,
  class VARCHAR(255) NOT NULL CHECK (class IN ('warrior', 'archer', 'mage', 'knight', 'barbarian', 'warlock', 'conjurer', 'hunter', 'marksman')),
  warmaster BOOLEAN DEFAULT FALSE,
  champion BOOLEAN DEFAULT FALSE,
  realm_points INT DEFAULT 0
)`, (err, result) => {
  if (err) {
    logger.error('Error creating characters table:', err);
    throw err;
  }
  logger.info('Table characters created or updated');
});

// regnum online resource server index
db.query(`CREATE TABLE IF NOT EXISTS regnum_res (
  id INT AUTO_INCREMENT PRIMARY KEY,
  res_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`, (err, result) => {
  if (err) {
    logger.error('Error creating regnum_res table:', err);
    throw err;
  }
  logger.info('Table regnum_res created or updated');
});

// import regnum online resource server index from json file
// it contains the filename and needs to be converted
// 12345-Filename-goes-here.png -> ID 12345, Name Filename goes here, Filename 12345-Filename-goes-here.png
//const regnumRes = require('../public/data/texturesparadise/files.json');
//if (Array.isArray(regnumRes.textures)) {
//  for (const res of regnumRes.textures) {
//    const res_id = parseInt(res.filename.split('-')[0]);
//    const filename = res.filename;
//    const type = 'texture';
//    const name = res.filename.split('-').slice(1).join(' ').split('.')[0];
//    const url = "https://cor-forum.de/regnum/datengrab/res/" + type.toUpperCase + "/" + res.filename;
//    db.query('INSERT INTO regnum_res (res_id, filename, name, type, url) VALUES (?, ?, ?, ?, ?)', [res_id, filename, name, type, url], (err) => {
//      if (err) {
//        logger.error('Error inserting regnum_res into database:', err);
//        throw err;
//      }
//    });
//  }
//} else {
//  logger.error('regnumRes.textures is not an array');
//}
//
//if (Array.isArray(regnumRes.sounds)) {
//  for (const res of regnumRes.sounds) {
//    const res_id = parseInt(res.filename.split('-')[0]);
//    const filename = res.filename;
//    const type = 'sound';
//    const name = res.filename.split('-').slice(1).join(' ').split('.')[0];
//    const url = "https://cor-forum.de/regnum/datengrab/res/" + type.toUpperCase + "/" + res.filename;
//    db.query('INSERT INTO regnum_res (res_id, filename, name, type, url) VALUES (?, ?, ?, ?, ?)', [res_id, filename, name, type, url], (err) => {
//      if (err) {
//        logger.error('Error inserting regnum_res into database:', err);
//        throw err;
//      }
//    });
//  }
//} else {
//  logger.error('regnumRes.sounds is not an array');
//}

// E-Mails

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

function sendEmail(to, subject, text, html, attachments) {
  // if to is a user id, get the email address from the database, else use the email address
  if (Number.isInteger(to)) {
    db.query('SELECT email FROM users WHERE id = ?', [to], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      return;
    }
    sendEmail(result[0].email, subject, text, html, attachments);
    });
    return;
  }
  const mailOptions = {
    from: SMTP_FROM,
    to: to,
    subject: subject,
    text: text,
    html: html,
    attachments: attachments
  };
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
    logger.error('Error sending email: ' + err);
    return;
    }
    logger.info('Email sent: ' + info.response);
  });
}

// E-Mail templates
const emailTemplates = {
  footer: '<p>Best regards,<br>CoRT Team</p>',
  loginNotification: (nickname, username, loginTime, loginIP) => {
    return `<p>Hello ${nickname} (${username}),</p><p>You have successfully logged in to your CoRT account.</p><p>Date: ${loginTime}<br>IP: ${loginIP}.</p>`;
  }
};

// send test email on startup to check if SMTP settings are correct
// sendEmail(1, 'Test email', 'This is a test email', '<p>This is a test email</p>');

// App
// Dependencies
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

// Express
const express = require('express');
const app = express();
app.use(bodyParser.json());

// Session
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');
const { exec } = require('child_process');

const sessionStore = new MySQLStore({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  port: DB_PORT,
});
app.use(
  session({
    secret: SESSION_SECRET, // Use a secret key for your session
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using https
    store: sessionStore,
  })
);

const checkAuth = require('./middleware/checkAuth'); // Adjust the path as necessary

// Routes
// / will serve static files from ../ and /api/v1 will serve the rest api
  app.use('/', express.static('public'));

// CORS
// Add headers to allow cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080', 'https://cort.cor-forum.de');
  res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization');
  next();
});

// Function to check username requirements
function checkUsernameRequirements(username) {
  // username must be between 3 and 20 characters and only contain letters, numbers, underscores and hyphens
  return username.match(/^[a-zA-Z0-9_-]{3,20}$/);
}
const usernameDoesNotMeetRequirements = 'Username must be between 3 and 20 characters and only contain letters, numbers, underscores and hyphens.';

// Function to check password requirements
function checkPasswordRequirements(password) {
  // password must be at least 8 characters long and contain at least one letter and one number
  return password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/);
}
const passwordDoesNotMeetRequirements = 'Password must be 8 characters long and contain at least one letter and one number.';

// Function to check nickname requirements
function checkNicknameRequirements(nickname) {
  // nickname must be between 3 and 20 characters and only contain letters, numbers, underscores and spaces
  return nickname.match(/^[a-zA-Z0-9_ ]{3,20}$/);
}
const nicknameDoesNotMeetRequirements = 'Nickname must be between 3 and 20 characters and only contain letters, numbers, underscores and spaces.';

// Function to check email requirements
function checkEmailRequirements(email) {
  return email.includes('@') && email.includes('.') && email.length > 5 && email.length < 255;
}
const emailDoesNotMeetRequirements = 'Invalid email address.';

const marketRoutes = require('./market');
app.use(API_PATH, marketRoutes);

// USERS
app.post(API_PATH + '/register', (req, res) => {
  const { email, password, username, nickname } = req.body;
  const registration_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const registration_ip = req.connection.remoteAddress;
  const created_at = new Date();
  const updated_at = new Date();
  logger.info('Registering user: ' + email, username, nickname, password);
  
  if (!checkUsernameRequirements(username)) {
    res.json({ status: 'error', message: usernameDoesNotMeetRequirements });
    return;
  }
  if (!checkNicknameRequirements(nickname)) {
    res.json({ status: 'error', message: nicknameDoesNotMeetRequirements });
    return;
  }
  if (!checkEmailRequirements(email)) {
    res.json({ status: 'error', message: emailDoesNotMeetRequirements });
    return;
  }
  if (!checkPasswordRequirements(password)) {
    res.json({ status: 'error', message: passwordDoesNotMeetRequirements });
    return;
  }

  // Check if username, nickname, or email are already used
  db.query('SELECT * FROM users WHERE username = ? OR nickname = ? OR email = ?', [username, nickname, email], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.length > 0) {
      res.json({ status: 'error', message: 'Username, nickname, or email already in use' });
      return;
    }
    
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        logger.error('Error hashing password: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      db.query('INSERT INTO users (email, password, username, nickname, role, created_at, updated_at, registration_key, registration_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [email, hash, username, nickname, 'user', created_at, updated_at, registration_key, registration_ip], (err) => {
        if (err) {
          logger.error('Error inserting user into database: ' + err);
          res.status(500).send('Internal Server Error');
          return;
        }
        // Send registration confirmation email
        const subject = 'Registration Confirmation';
        const text = 'Thank you for registering. Please click the link below to activate your account:';
        const html = `<p>Thank you for registering. Please click the link below to activate your account:</p><a href="${HOST}/api/v1/activate/${registration_key}">${HOST}/api/v1/activate/${registration_key}</a>`;
        sendEmail(email, subject, text, html);
        logger.info('User registered: ' + email, username, nickname, password);
        res.json({ status: 'success', message: 'User registered' });
      });
    });
  });
});

// Example curl request:
// curl -X POST -H "Content-Type: application/json" -d '{"email":"example@example.com","password":"password123","username":"example","nickname":"John"}' http://localhost:8080/api/v1/register

// login - login with email and password
// user can login with email or username and password. check if user is using email or username and query database accordingly
app.post(API_PATH + '/login', (req, res) => {
  const { login, password } = req.body;
  logger.info('Logging in user: ' + login, password);

  const isEmail = login.includes('@');
  const query = isEmail ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE username = ?';
  db.query(query, [login], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.length === 0) {
      logger.info('Invalid login: ' + login);
      res.json({ status: 'error', message: 'Invalid login' });
      return;
    }
    if (!result[0].active) {
      logger.info('User not activated: ' + login);
      res.json({ status: 'error', message: 'User not activated' });
      return;
    }
    const user = result[0];
    bcrypt.compare(password, user.password, (err, same) => {
      if (err) {
        logger.error('Error comparing passwords: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      if (!same) {
        logger.info('Invalid password: ' + login);
        res.json({ status: 'error', message: 'Invalid password' });
        return;
      }
      if (same) {
        req.session.userId = user.id;
        req.session.username = user.username;
        const last_login = new Date();
        const last_ip = req.connection.remoteAddress;
        db.query('UPDATE users SET last_login = ?, last_ip = ? WHERE id = ?', [last_login, last_ip, user.id], (err, result) => {
          if (err) {
            logger.error('Error updating last_login and last_ip: ' + err);
            res.status(500).send('Internal Server Error');
            return;
          }
          logger.info('User logged in: ' + user.email, user.username, user.nickname, user.role);
          res.json({ status: 'success', message: 'User logged in', user: { id: user.id, email: user.email, username: user.username, nickname: user.nickname, role: user.role } });

          var text = emailTemplates.loginNotification(user.nickname, user.username, last_login, last_ip) + emailTemplates.footer;
          var html = emailTemplates.loginNotification(user.nickname, user.username, last_login, last_ip) + emailTemplates.footer;
          sendEmail(user.id, 'CoRT Login Notification', text, html);
        });
        return; 
      }
      res.send('User logged in');
    });
  });
});

// logout - destroy session
app.post(API_PATH + '/logout', (req, res) => {
    req.session.destroy();
    res.json({ status: 'success', message: 'Logged out' });
});

// activate - activate user account with registration key
app.get(API_PATH + '/activate/:registration_key', (req, res) => {
  logger.info('Activating user with registration key: ' + req.params.registration_key);
  db.query('UPDATE users SET active = TRUE WHERE registration_key = ?', [req.params.registration_key], (err) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    db.query('UPDATE users SET registration_key = NULL WHERE registration_key = ?', [req.params.registration_key], (err) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.send('User activated. You can now login <a href="/#login">here</a>.');
    });
  });
});

// password reset - initiate password reset with email or username
app.post(API_PATH + '/password/reset', (req, res) => {
  const login = req.body.login;
  logger.info('Initiating password reset for: ' + login);

  // check if login is email or username
  const isEmail = login.includes('@');
  const query = isEmail ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE username = ?';
  db.query(query, [login], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.length === 0) {
      logger.info('Invalid login: ' + login);
      res.json({ status: 'error', message: 'Invalid login' });
      return;
    }
    const user = result[0];
    const password_reset_key = Math.random().toString(36).substring(2, 62);
    const password_reset_expires = new Date();
    password_reset_expires.setHours(password_reset_expires.getHours() + 1);
    const password_reset_ip = req.connection.remoteAddress;
    db.query('UPDATE users SET password_reset_key = ?, password_reset_expires = ?, password_reset_ip = ? WHERE id = ?', [password_reset_key, password_reset_expires, password_reset_ip, user.id], (err, result) => {
      if (err) {
        logger.error('Error updating password reset key in database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Send password reset email
      const subject = 'Password Reset';
      const text = 'Please click the link below to reset your password:';
      const html = `<p>Please click the link below to reset your password:</p><a href="${HOST}/?pwresetkey=${password_reset_key}">${HOST}/?pwresetkey=${password_reset_key}</a>`;
      sendEmail(user.id, subject, text, html);
      res.json({ status: 'success', message: 'A password reset link has been sent to your email address.' });
    });
  });
});

// reset password - reset password with password reset key
app.post(API_PATH + '/password/reset/:password_reset_key', (req, res) => {
  const password_reset_key = req.params.password_reset_key;
  const { password } = req.body;

  // check password requirements
  if (!checkPasswordRequirements(password)) {
    res.json({ status: 'error', message: passwordDoesNotMeetRequirements });
    return;
  }

  logger.info('Resetting password with password reset key: ' + password_reset_key, password);
  db.query('SELECT * FROM users WHERE password_reset_key = ? AND password_reset_expires > ?', [password_reset_key, new Date()], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.length === 0) {
      res.json({ status: 'error', message: 'Invalid password reset key or expired' });
      return;
    }
    const user = result[0];
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        logger.error('Error hashing password: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      db.query('UPDATE users SET password = ?, password_reset_key = NULL, password_reset_expires = NULL, password_reset_ip = NULL WHERE id = ?', [hash, user.id], (err, result) => {
        if (err) {
          logger.error('Error updating password in database: ' + err);
          res.status(500).send('Internal Server Error');
          return;
        }
        res.json({ status: 'success', message: 'Password reset' });
      });
    });
  });
});

// retrieve own user
app.get(API_PATH + '/user', checkAuth, (req, res) => {
    db.query('SELECT id, email, username, nickname, role FROM users WHERE id = ?', [req.session.userId], (err, result) => {
        if (err) {
            logger.error('Error querying database: ' + err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.send(result[0]);
    });
});

// update own user
app.put(API_PATH + '/user', checkAuth, (req, res) => {
    const { email, nickname } = req.body;
    const updated_at = new Date();
    logger.info('Updating user ID with new email ' + email + ' and nickname ' + nickname);

    // Check nickname requirements
    if (!checkNicknameRequirements(nickname)) {
      res.json({ status: 'error', message: nicknameDoesNotMeetRequirements });
      return;
    }

    // Check email requirements
    if (!checkEmailRequirements(email)) {
      res.json({ status: 'error', message: emailDoesNotMeetRequirements });
      return;
    }
    
    // if email is changed, check if it is already in use.
    // if not, update user and send email verification email
    // if nickname is changed, check if it is already in use
    // if not, update user
    db.query('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      const user = result[0];
      if (email !== user.email) {
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
          if (err) {
            logger.error('Error querying database: ' + err);
            res.status(500).send('Internal Server Error');
            return;
          }
          if (result.length > 0) {
            res.json({ status: 'error', message: 'Email already in use' });
            return;
          }
          const email_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          const email_verification_expires = new Date();
          email_verification_expires.setHours(email_verification_expires.getHours() + 1);
          db.query('UPDATE users SET email = ?, nickname = ?, updated_at = ?, email_verified = FALSE, email_verification_key = ?, email_verification_expires = ? WHERE id = ?', [email, nickname, updated_at, email_verification_key, email_verification_expires, user.id], (err, result) => {
            if (err) {
              logger.error('Error updating user in database: ' + err);
              res.status(500).send('Internal Server Error');
              return;
            }
            const subject = 'Email Verification';
            const text = 'Please click the link below to verify your email address:';
            const html = `<p>Please click the link below to verify your email address:</p><a href="${HOST}/api/v1/user/email/verify/${email_verification_key}">${HOST}/api/v1/user/email/verify/${email_verification_key}</a>`;
            sendEmail(user.id, subject, text, html);
            res.json({ status: 'success', message: 'User updated. Please check your email for verification.' });
          });
        });
      } else {
        db.query('UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?', [nickname, updated_at, user.id], (err, result) => {
          if (err) {
            logger.error('Error updating user in database: ' + err);
            res.status(500).send('Internal Server Error');
            return;
          }
          res.json({ status: 'success', message: 'User updated' });
        });
      }
    });
});

// GDPR export data - export user data in JSON format and send it via email
app.get(API_PATH + '/user/exportdata', checkAuth, (req, res) => {
  db.query('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }

    // check if user has requested data export in the last 60 seconds
    if (result[0].last_gdpr_export && new Date(result[0].last_gdpr_export).getTime() > new Date().getTime() - 60000) {
      res.json({ status: 'error', message: 'You have already requested a data export. Please wait a minute before requesting another one.' });
      return;
    }

    const user = result[0];
    const subject = 'Your CoRT GDPR Data Export';
    const text = 'Here is your GDPR compliant data export:' + JSON.stringify(user, null, 2);
    const html = `<p>Here is your GDPR compliant data export:</p><pre>${JSON.stringify(user, null, 2)}</pre>`;
    sendEmail(user.id, subject, text, html);
    const updated_at = new Date();
    db.query('UPDATE users SET last_gdpr_export = ? WHERE id = ?', [updated_at, user.id], (err, result) => {
      if (err) {
        logger.error('Error updating last_gdpr_export: ' + err);
        return;
      }
      res.json({ status: 'success', message: 'Your data has been exported. Please check your e-mails.' });
    });
  });
});


const emailVerificationRouter = require('./emailVerification'); // Adjust the path as necessary
app.use(API_PATH, emailVerificationRouter);

const trainerRoutes = require('./regnumTrainer'); // Adjust the path as necessary
app.use(API_PATH, trainerRoutes);

const cortNewsRoutes = require('./cortNews'); // Adjust the path as necessary
app.use(API_PATH, cortNewsRoutes);

// get all regnum resources
app.get(API_PATH + '/regnum/resources', (req, res) => {
  db.query('SELECT * FROM regnum_res', (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      return res.status(500).send('Internal Server Error');
    }
    res.send(result);
  });
});

app.get(API_PATH + '/regnum/resources/datatables', (req, res) => {
  const search = req.query.search ? req.query.search.value || '' : ''; // Handle missing search parameter
  const start = parseInt(req.query.start) || 0; // Default start to 0
  const length = parseInt(req.query.length) || 10; // Default length to 10
  const type = req.query.type || ''; // Get the type parameter

  // Build the query conditionally based on the presence of the type parameter
  let query = 'SELECT * FROM regnum_res WHERE (name LIKE ? OR filename LIKE ?)';
  let countQuery = 'SELECT COUNT(*) as count FROM regnum_res WHERE (name LIKE ? OR filename LIKE ?)';
  const queryParams = ['%' + search + '%', '%' + search + '%'];
  const countQueryParams = ['%' + search + '%', '%' + search + '%'];

  if (type) {
    query += ' AND type = ?';
    countQuery += ' AND type = ?';
    queryParams.push(type);
    countQueryParams.push(type);
  }

  query += ' ORDER BY res_id ASC LIMIT ?, ?';
  queryParams.push(start, length);

  db.query(query, queryParams, (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      return res.status(500).send('Internal Server Error');
    }

    db.query(countQuery, countQueryParams, (err, countResult) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        return res.status(500).send('Internal Server Error');
      }

      res.json({
        draw: parseInt(req.query.draw) || 0, // Handle missing draw parameter
        recordsTotal: countResult[0].count,
        recordsFiltered: countResult[0].count,
        data: result
      });
    });
  });
});



if (process.env.NODE_ENV === 'production') {
  // run "python3 warstatus/warstatus.py" every minute and once on startup
  function runWarstatus() {
    exec('cd warstatus && python3 warstatus.py', (err, stdout, stderr) => {
      if (err) {
        logger.error('Error running warstatus.py:', err);
        return;
      }
      logger.info('Warstatus.py output:', stdout);
    });
  }
  runWarstatus();
  setInterval(runWarstatus, 60000);
}

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on ${HOST}:${PORT}`);
});

// End of file