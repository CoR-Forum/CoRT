// this nodejs server will serve a rest api for the frontend to consume
// everything will be in one file for simplicity
// users will be able to register, login and create markets and items in the markets
// to sell or buy their ingame items from Regnum Online
//
// Core - USERS
// register, login, logout, get user, update own user
// fields: id, email, password, username, nickname, role, created_at, updated_at
//
// Core - MARKET
// get markets, get market by id, create market, update market, delete market
// fields: id, name, description, created_at, updated_at, realm
//
// Core - PRIVATE MARKET
// get private markets, get private market by id, create own private market, update private market, delete own private market
// fields: id, name, description, created_at, updated_at, realm, user_id
//
// Core - MARKET ITEM
// get market items, get market item by id, create market item, update market item, delete market item
// fields: id, name, description, images, price, currency, created_at, updated_at, market_id, user_id, type (sell, buy), status (active, inactive, sold), sold_at, buyer_id, sellType (auction, fixed)
//
// 
// Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const socket = require('socket.io');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// Winston logger
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;

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

// Database
const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  port: DB_PORT,
});

db.connect((err) => {
    if (err) {
        logger.error('Database connection failed: ' + err.stack);
        return;
    }
    logger.info('Connected to database: ' + db.threadId);
    });

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

// markets
db.query(`CREATE TABLE IF NOT EXISTS markets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  realm VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`, (err, result) => {
  if (err) {
    logger.error('Error creating markets table:', err);
    throw err;
  }
  logger.info('Table markets created or updated');
});

// private markets
db.query(`CREATE TABLE IF NOT EXISTS private_markets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  realm VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`, (err, result) => {
  if (err) {
    logger.error('Error creating private_markets table:', err);
    throw err;
  }
  logger.info('Table private_markets created or updated');
});

// market items
db.query(`CREATE TABLE IF NOT EXISTS market_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  images TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(255) NOT NULL CHECK (currency IN ('magnanite', 'euro')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  market_id INT NOT NULL,
  user_id INT NOT NULL,
  type VARCHAR(255) NOT NULL CHECK (type IN ('auction', 'static')),
  status VARCHAR(255) NOT NULL,
  sold_at TIMESTAMP,
  buyer_id INT,
  sellType VARCHAR(255) NOT NULL,
  item_type VARCHAR(255) NOT NULL CHECK (item_type IN ('weapon', 'armor', 'jewelry', 'misc', 'magnanite')),
  bids INT DEFAULT 0
)`, (err, result) => {
  if (err) {
    logger.error('Error creating market_items table:', err);
    throw err;
  }
  logger.info('Table market_items created or updated');
});

// bids
db.query(`CREATE TABLE IF NOT EXISTS bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  market_item_id INT NOT NULL,
  user_id INT NOT NULL
)`, (err, result) => {
  if (err) {
    logger.error('Error creating bids table:', err);
    throw err;
  }
  logger.info('Table bids created or updated');
});

// default markets. check if they exist, if not create them
db.query('SELECT * FROM markets WHERE name = ?', ['Syrtis'], (err, result) => {
  if (err) {
    logger.error('Error checking markets table:', err);
    throw err;
  }
  if (result.length === 0) {
    db.query('INSERT INTO markets (name, description, realm) VALUES (?, ?, ?)', ['Syrtis', 'Market for Syrtis', 'Syrtis'], (err, result) => {
      if (err) {
        logger.error('Error creating default market:', err);
        throw err;
      }
      logger.info('Default market created');
    });
  }
});

// saved trainer setups
db.query(`CREATE TABLE IF NOT EXISTS trainer_setups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  setup_version VARCHAR(255),
  setup_class VARCHAR(255),
  setup_level INT,
  user_id INT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  recommendations INT DEFAULT 0,
  rating DECIMAL(10,2) DEFAULT 0.00,
  ratings INT DEFAULT 0
)`, (err, result) => {
  if (err) {
    logger.error('Error creating trainer_setups table:', err);
    throw err;
  }
  logger.info('Table trainer_setups created or updated');
});

// saved trainer setups ratings
db.query(`CREATE TABLE IF NOT EXISTS trainer_setup_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rating DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  recommendation BOOLEAN NOT NULL DEFAULT FALSE,
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trainer_setup_id INT NOT NULL,
  user_id INT NOT NULL
)`, (err, result) => {
  if (err) {
    logger.error('Error creating trainer_setup_ratings table:', err);
    throw err;
  }
  logger.info('Table trainer_setup_ratings created or updated');
});

// EMAILS

const nodemailer = require('nodemailer');

// SMTP

// create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// function to send email to user
// "to" is the user id, "subject" is the subject, "text" is the text version, "html" is the html version

function sendEmail(to, subject, text, html) {
  if (typeof to === 'number') {
    db.query('SELECT email FROM users WHERE id = ?', [to], (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        return;
      }
      const mailOptions = {
        from: SMTP_FROM,
        to: result[0].email,
        subject: subject,
        text: text,
        html: html,
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          logger.error('Error sending email: ' + err);
          return;
        }
        logger.info('Email sent: ' + info.response);
      });
    });
  } else {
    const mailOptions = {
      from: SMTP_FROM,
      to: to,
      subject: subject,
      text: text,
      html: html,
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        logger.error('Error sending email: ' + err);
        return;
      }
      logger.info('Email sent: ' + info.response);
    });
  }
};

// send test email on startup to user id 4
//sendEmail(4, 'Test email', 'This is a test email', '<p>This is a test email</p>');

// App
const app = express();
app.use(bodyParser.json());

// Import express-session

// Configure express-session
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

// Middleware to check if user is logged in
function checkAuth(req, res, next) {
  if (req.session.userId) {
      next(); // User is logged in, proceed to the next middleware
  } else {
      res.json({ status: 'unauthorized', message: 'Unauthorized, please login' });
  }
}

// Routes
// / will serve static files from ../ and /api/v1 will serve the rest api
  app.use('/', express.static('public'));

// CORS
// Add headers to allow cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
  // email must contain @ and . and be between 5 and 255 characters long
  return email.includes('@') && email.includes('.') && email.length > 5 && email.length < 255;
}
const emailDoesNotMeetRequirements = 'Invalid email address.';


// USERS
// register - register a new user with email, password, username, nickname.
// encrypt password with bcrypt
app.post(API_PATH + '/register', (req, res) => {
  const { email, password, username, nickname } = req.body;
  const registration_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const registration_ip = req.connection.remoteAddress;
  const created_at = new Date();
  const updated_at = new Date();
  logger.info('Registering user: ' + email, username, nickname, password);
  
  // Check username requirements
  if (!checkUsernameRequirements(username)) {
    res.json({ status: 'error', message: usernameDoesNotMeetRequirements });
    return;
  }

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
  
  // Check password requirements
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
      res.json({ status: 'error', message: 'Invalid login' });
      return;
    }
    // check if user is active
    if (!result[0].active) {
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
        res.status(401).send('Invalid login');
        return;
      }
      if (same) {
        req.session.userId = user.id;
        req.session.username = user.username;
        // update last_login and last_ip
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

          // send login notification email
          const subject = 'Login Notification';
          const text = `Hello ${user.username},\n\nYou have successfully logged in to your account on ${last_login}.`;
          const html = `<p>Hello ${user.username},</p><p>You have successfully logged in to your account on ${last_login}.</p>`;
          sendEmail(user.id, subject, text, html);
        });
        return; // Add return statement here
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
  const registration_key = req.params.registration_key;
  logger.info('Activating user with registration key: ' + registration_key);
  db.query('UPDATE users SET active = TRUE WHERE registration_key = ?', [registration_key], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    db.query('UPDATE users SET registration_key = NULL WHERE registration_key = ?', [registration_key], (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.send('User activated. You can now login.');
    });
  });
});

// initiate password reset - send email with password reset link
// user enters email or username, check if user exists, generate password reset key, send email with password reset link
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
// user enters new password, check if password reset key is valid and not expired, update password
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
// if the e-mail is changed, send a verification e-mail
app.put(API_PATH + '/user', checkAuth, (req, res) => {
    const { email, nickname } = req.body;
    const updated_at = new Date();
    logger.info('Updating user: ' + email, nickname);

    // Check if email, username and nickname are valid
    if (!email.includes('@') || !email.includes('.') || email.length < 5 || email.length > 255) {
      res.json({ status: 'error', message: 'Invalid email' });
      return;
    }
    // nickname must be between 3 and 20 characters and only contain letters, numbers, underscores and spaces
    if (!nickname.match(/^[a-zA-Z0-9_ ]{3,20}$/)) {
      res.json({ status: 'error', message: 'Invalid nickname' });
      return;
    }
    
    db.query('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, result) => {
        if (err) {
            logger.error('Error querying database: ' + err);
            res.status(500).send('Internal Server Error');
            return;
        }
        const user = result[0];
        // Check if email is changed
        if (email !== user.email) {
          db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
            if (err) {
              logger.error('Error querying database: ' + err);
              res.status(500).send('Internal Server Error');
              return;
            }
            if (result.length > 0) {
              res.json({ status: 'error', message: 'Email is already in use' });
              return;
            }
            // check if nickname is changed
            if (nickname !== user.nickname) {
              checkNickname();
            }
          });
        } else {
          // check if nickname is changed
          if (nickname !== user.nickname) {
            checkNickname();
          } else {
            updateUserInfo();
          }
        }

        function checkNickname() {
          db.query('SELECT * FROM users WHERE nickname = ?', [nickname], (err, result) => {
            if (err) {
              logger.error('Error querying database: ' + err);
              res.status(500).send('Internal Server Error');
              return;
            }
            if (result.length > 0) {
              res.json({ status: 'error', message: 'Nickname is already in use' });
              return;
            }
            updateUserInfo();
          });
        }

        function updateUserInfo() {
          db.query('UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?', [nickname, updated_at, req.session.userId], (err, result) => {
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

// confirm email - confirm email with email verification key
// if the key is expired, send a new verification e-mail
app.get(API_PATH + '/user/email/verify/:email_verification_key', (req, res) => {
  const email_verification_key = req.params.email_verification_key;
  logger.info('Verifying email with email verification key: ' + email_verification_key);
  db.query('SELECT * FROM users WHERE email_verification_key = ? AND email_verification_expires > ?', [email_verification_key, new Date()], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.length === 0) {
      res.json({ status: 'error', message: 'Invalid email verification key or expired' });
      return;
    }
    const user = result[0];
    db.query('UPDATE users SET email_verified = TRUE, email_verification_key = NULL, email_verification_expires = NULL WHERE id = ?', [user.id], (err, result) => {
      if (err) {
        logger.error('Error updating email verification in database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json({ status: 'success', message: 'Email verified' });
    });
  });
});

// create trainer setup
app.post(API_PATH + '/trainer/setup', checkAuth, (req, res) => {
  const { name, url, setup_version, setup_class, setup_level } = req.body;
  const created_at = new Date();
  const updated_at = new Date();
  logger.info('Creating trainer setup: ' + name, url);

  // Check if name and url are provided
  if (!name || !url) {
    res.json({ status: 'error', message: 'Please provide name and url' });
    return;
  }

  // Check if user has reached the limit of 10 setups per hour
  const hourAgo = new Date();
  hourAgo.setHours(hourAgo.getHours() - 1);
  db.query('SELECT COUNT(*) AS setupCount FROM trainer_setups WHERE user_id = ? AND created_at > ?', [req.session.userId, hourAgo], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    const setupCount = result[0].setupCount;
    if (setupCount >= 10) {
      res.json({ status: 'error', message: 'You have reached the limit of 10 setups per hour' });
      return;
    }

    db.query('INSERT INTO trainer_setups (name, url, created_at, updated_at, user_id, setup_version, setup_class, setup_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [name, url, created_at, updated_at, req.session.userId, setup_version, setup_class, setup_level], (err, result) => {
      if (err) {
        logger.error('Error inserting trainer setup into database: ' + err);
        res.json({ status: 'error', message: 'Error creating trainer setup' });
        return;
      }
      res.json({ status: 'success', message: 'Trainer setup created' });
    });
  });
});

// retrieve own trainer setups
app.get(API_PATH + '/trainer/mysetups', checkAuth, (req, res) => {
    db.query('SELECT * FROM trainer_setups WHERE user_id = ?', [req.session.userId], (err, result) => {
        if (err) {
            logger.error('Error querying database: ' + err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.send(result);
    });
});

// retrieve all public trainer setups
// include user nickname and id
app.get(API_PATH + '/trainer/setups', (req, res) => {
  db.query('SELECT trainer_setups.*, users.nickname, users.id AS user_id FROM trainer_setups JOIN users ON trainer_setups.user_id = users.id WHERE is_public = TRUE', (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.send(result);
  });
});

// /trainer/myratings/:id will return the rating and the recommendations of the trainer setup
// if the user has already rated the setup, return the rating, else return 0.00
app.get(API_PATH + '/trainer/myratings/:id', checkAuth, (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM trainer_setup_ratings WHERE trainer_setup_id = ? AND user_id = ?', [id, req.session.userId], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.length === 0) {
      res.json({ rating: 0.00, recommendation: 0, review: ''});
      return;
    }
    res.json(result[0]);
  });
});

// update the rating and the recommendations of the trainer setup. if the user has already rated the setup, update the rating, else insert a new rating.
app.post(API_PATH + '/trainer/rate/:id', checkAuth, (req, res) => {
  const id = req.params.id;
  const { rating, recommendation, review } = req.body;
  logger.info('Rating trainer setup: ' + id, rating, recommendation, review);
  
  // Check if the user is the owner of the trainer setup
  db.query('SELECT user_id FROM trainer_setups WHERE id = ?', [id], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    const ownerId = result[0].user_id;
    
    // Check if the user is the owner of the trainer setup
    if (req.session.userId === ownerId) {
      res.json({ status: 'error', message: 'You cannot rate your own trainer setup' });
      return;
    }
    
    // Check if the rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      res.json({ status: 'error', message: 'Rating must be between 1 and 5' });
      return;
    }
    
    db.query('SELECT * FROM trainer_setup_ratings WHERE trainer_setup_id = ? AND user_id = ?', [id, req.session.userId], (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      if (result.length === 0) {
        db.query('INSERT INTO trainer_setup_ratings (rating, trainer_setup_id, user_id, recommendation, review) VALUES (?, ?, ?, ?, ?)', [rating, id, req.session.userId, recommendation, review], (err, result) => {
          if (err) {
            logger.error('Error inserting rating into database: ' + err);
            res.status(500).send('Internal Server Error');
            return;
          }
          recalculateRating(id); // Call recalculateRating after successful rating
          res.json({ status: 'success', message: 'Rating inserted' });
        });
      } else {
        db.query('UPDATE trainer_setup_ratings SET rating = ?, recommendation = ?, review = ? WHERE trainer_setup_id = ? AND user_id = ?', [rating, recommendation, review, id, req.session.userId], (err, result) => {
          if (err) {
            logger.error('Error updating rating in database: ' + err);
            res.status(500).send('Internal Server Error');
            return;
          }
          recalculateRating(id); // Call recalculateRating after successful rating
          res.json({ status: 'success', message: 'Rating updated' });
        });
      }
    });
  });
});

// remove own rating of a trainer setup
app.delete(API_PATH + '/trainer/rate/:id', checkAuth, (req, res) => {
  const id = req.params.id;
  logger.info('Deleting rating of trainer setup: ' + id);
  db.query('DELETE FROM trainer_setup_ratings WHERE trainer_setup_id = ? AND user_id = ?', [id, req.session.userId], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json({ status: 'success', message: 'Rating deleted' });
    recalculateRating(id); // Call recalculateRating after successful rating
  });
});

// get all ratings of a trainer setup including the user nickname
app.get(API_PATH + '/trainer/ratings/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT trainer_setup_ratings.*, users.nickname FROM trainer_setup_ratings JOIN users ON trainer_setup_ratings.user_id = users.id WHERE trainer_setup_id = ?', [id], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.send(result);
  });
});

// function to recalculate the rating of a trainer setup and count the ratings recommendations
function recalculateRating(id) {
  db.query('SELECT AVG(rating) AS rating, SUM(recommendation) AS recommendations, COUNT(rating) AS ratings FROM trainer_setup_ratings WHERE trainer_setup_id = ?', [id], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      return;
    }
    db.query('UPDATE trainer_setups SET rating = ?, recommendations = ?, ratings = ? WHERE id = ?', [result[0].rating, result[0].recommendations, result[0].ratings, id], (err, result) => {
      if (err) {
        logger.error('Error updating rating in database: ' + err);
        return;
      }
    });
  });
}

// delete own trainer setup
app.delete(API_PATH + '/trainer/mysetups/:id', checkAuth, (req, res) => {
  const id = req.params.id;
  logger.info('Deleting trainer setup: ' + id);
    db.query('DELETE FROM trainer_setups WHERE id = ? AND user_id = ?', [id, req.session.userId], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.affectedRows === 0) {
      res.json({ status: 'error', message: 'Trainer setup not found or unauthorized' });
      return;
    }
    
    // Delete all ratings of the deleted setup
    db.query('DELETE FROM trainer_setup_ratings WHERE trainer_setup_id = ?', [id], (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json({ status: 'success', message: 'Trainer setup deleted' });
    });
  });
});

// change public status of own trainer setup
app.put(API_PATH + '/trainer/mysetups/:id/status', checkAuth, (req, res) => {
  const id = req.params.id;
  const is_public = req.body.is_public;
  logger.info('Changing public status of trainer setup: ' + id, is_public);
  db.query('UPDATE trainer_setups SET is_public = ? WHERE id = ? AND user_id = ?', [is_public, id, req.session.userId], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.affectedRows === 0) {
      res.json({ status: 'error', message: 'Trainer setup not found or unauthorized' });
      return;
    }
    res.json({ status: 'success', message: 'Trainer setup public status changed' });
  });
});

// change name of own trainer setup
app.put(API_PATH + '/trainer/mysetups/:id/name', checkAuth, (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  logger.info('Changing name of trainer setup: ' + id, name);
  db.query('UPDATE trainer_setups SET name = ? WHERE id = ? AND user_id = ?', [name, id, req.session.userId], (err, result) => {
    if (err) {
      logger.error('Error querying database: ' + err);
      return res.status(500).send('Internal Server Error');
    }
    if (result.affectedRows === 0) {
      return res.json({ status: 'error', message: 'Trainer setup not found or unauthorized' });
    }
    res.json({ status: 'success', message: 'Trainer setup name changed' });
  });
});


// Start server
app.listen(PORT, () => {
  logger.info(`Server running on ${HOST}:${PORT}`);
});

// End of file