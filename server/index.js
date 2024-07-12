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
// require smtp for sending emails
const nodemailer = require('nodemailer');

require('dotenv').config();


// Constants
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
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database: ' + db.threadId);
    });

// check if database exists, if not create it
// if it exists, check if tables exist, if not create them
// users
db.query(`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
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
  last_ip VARCHAR(255)
)`, (err, result) => {
  if (err) throw err;
  console.log('Table users created or updated');
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
  if (err) throw err;
  console.log('Table markets created or updated');
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
  if (err) throw err;
  console.log('Table private_markets created or updated');
});

// market items
db.query(`CREATE TABLE IF NOT EXISTS market_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    images TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    market_id INT NOT NULL,
    user_id INT NOT NULL,
    type VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    sold_at TIMESTAMP,
    buyer_id INT,
    sellType VARCHAR(255) NOT NULL
    )`, (err, result) => {
    if (err) throw err;
    console.log('Table market_items created or updated');
    });

// default markets. check if they exist, if not create them
db.query('SELECT * FROM markets WHERE name = ?', ['Syrtis'], (err, result) => {
  if (err) throw err;
  if (result.length === 0) {
    db.query('INSERT INTO markets (name, description, realm) VALUES (?, ?, ?)', ['Syrtis', 'Market for Syrtis', 'Syrtis'], (err, result) => {
      if (err) throw err;
      console.log('Default market created');
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
  is_public BOOLEAN DEFAULT FALSE
)`, (err, result) => {
  if (err) throw err;
  console.log('Table trainer_setups created or updated');
});

// SMTP
// check if smtp is configured
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM) {
  console.log('SMTP configured');
}

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
// "to" is the user id, "subject" is the subject of the email, "text" is the text of the email
// "html" is the html of the email

function sendEmail(to, subject, text, html) {
  if (typeof to === 'number') {
    db.query('SELECT email FROM users WHERE id = ?', [to], (err, result) => {
      if (err) {
        console.error('Error querying database: ' + err);
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
          console.error('Error sending email: ' + err);
          return;
        }
        console.log('Email sent: ' + info.response);
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
        console.error('Error sending email: ' + err);
        return;
      }
      console.log('Email sent: ' + info.response);
    });
  }
}

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

// USERS
// register - register a new user with email, password, username, nickname.
// encrypt password with bcrypt
app.post(API_PATH + '/register', (req, res) => {
  const { email, password, username, nickname } = req.body;
  const registration_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const registration_ip = req.connection.remoteAddress;
  const created_at = new Date();
  const updated_at = new Date();
  console.log('Registering user: ' + email, username, nickname, password);
  
  // Check if fields are empty
  if (!email || !password || !username || !nickname) {
    res.json({ status: 'error', message: 'Please enter all fields' });
    return;
  }

  // Check if email, username and nickname are valid
  if (!email.includes('@') || !email.includes('.') || email.length < 5 || email.length > 255) {
    res.json({ status: 'error', message: 'Invalid email' });
    return;
  }
  // username must be between 3 and 20 characters and only contain letters, numbers, and underscores
  if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
    res.json({ status: 'error', message: 'Invalid username' });
    return;
  }
  // nickname must be between 3 and 20 characters and only contain letters, numbers, underscores and spaces
  if (!nickname.match(/^[a-zA-Z0-9_ ]{3,20}$/)) {
    res.json({ status: 'error', message: 'Invalid nickname' });
    return;
  }

  // Check if username, nickname, or email are already used
  db.query('SELECT * FROM users WHERE username = ? OR nickname = ? OR email = ?', [username, nickname, email], (err, result) => {
    if (err) {
      console.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.length > 0) {
      res.json({ status: 'error', message: 'Username, nickname, or email already in use' });
      return;
    }
    
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      db.query('INSERT INTO users (email, password, username, nickname, role, created_at, updated_at, registration_key, registration_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [email, hash, username, nickname, 'user', created_at, updated_at, registration_key, registration_ip], (err) => {
        if (err) {
          console.error('Error inserting user into database: ' + err);
          res.status(500).send('Internal Server Error');
          return;
        }
        // Send registration confirmation email
        const subject = 'Registration Confirmation';
        const text = 'Thank you for registering. Please click the link below to activate your account:';
        const html = `<p>Thank you for registering. Please click the link below to activate your account:</p><a href="${HOST}/api/v1/activate/${registration_key}">${HOST}/api/v1/activate/${registration_key}</a>`;
        sendEmail(email, subject, text, html);
        console.log('User registered: ' + email, username, nickname, password);
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
  console.log('Logging in user: ' + login, password);

    // Check if login is valid and does not include mysql wildcard characters
    if (login.includes('%') || login.includes('_')) {
      res.json({ status: 'error', message: 'Invalid username or email' });
      return;
    }

  // check if login is email or username
  const isEmail = login.includes('@');
  const query = isEmail ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE username = ?';
  db.query(query, [login], (err, result) => {
    if (err) {
      console.error('Error querying database: ' + err);
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
        console.error('Error comparing passwords: ' + err);
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
            console.error('Error updating last_login and last_ip: ' + err);
            res.status(500).send('Internal Server Error');
            return;
          }
          console.log('User logged in: ' + user.email, user.username, user.nickname, user.role);
          res.json({ status: 'success', message: 'User logged in', user: { id: user.id, email: user.email, username: user.username, nickname: user.nickname, role: user.role } });
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
  console.log('Activating user with registration key: ' + registration_key);
  db.query('UPDATE users SET active = TRUE WHERE registration_key = ?', [registration_key], (err, result) => {
    if (err) {
      console.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    db.query('UPDATE users SET registration_key = NULL WHERE registration_key = ?', [registration_key], (err, result) => {
      if (err) {
        console.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.send('User activated. You can now login.');
    });
  });
});

// retrieve own user
app.get(API_PATH + '/user', checkAuth, (req, res) => {
    db.query('SELECT id, email, username, nickname, role FROM users WHERE id = ?', [req.session.userId], (err, result) => {
        if (err) {
            console.error('Error querying database: ' + err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.send(result[0]);
    });
});

// create trainer setup
app.post(API_PATH + '/trainer/setup', checkAuth, (req, res) => {
  const { name, url, setup_version, setup_class, setup_level } = req.body;
  const created_at = new Date();
  const updated_at = new Date();
  console.log('Creating trainer setup: ' + name, url);

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
      console.error('Error querying database: ' + err);
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
        console.error('Error inserting trainer setup into database: ' + err);
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
            console.error('Error querying database: ' + err);
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
      console.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.send(result);
  });
});


// delete own trainer setup
app.delete(API_PATH + '/trainer/mysetups/:id', checkAuth, (req, res) => {
  const id = req.params.id;
  console.log('Deleting trainer setup: ' + id);
  db.query('DELETE FROM trainer_setups WHERE id = ? AND user_id = ?', [id, req.session.userId], (err, result) => {
    if (err) {
      console.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.affectedRows === 0) {
      res.json({ status: 'error', message: 'Trainer setup not found or unauthorized' });
      return;
    }
    res.json({ status: 'success', message: 'Trainer setup deleted' });
  });
});

// change public status of own trainer setup
app.put(API_PATH + '/trainer/mysetups/:id/status', checkAuth, (req, res) => {
  const id = req.params.id;
  const is_public = req.body.is_public;
  console.log('Changing public status of trainer setup: ' + id, is_public);
  db.query('UPDATE trainer_setups SET is_public = ? WHERE id = ? AND user_id = ?', [is_public, id, req.session.userId], (err, result) => {
    if (err) {
      console.error('Error querying database: ' + err);
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
  console.log('Changing name of trainer setup: ' + id, name);
  db.query('UPDATE trainer_setups SET name = ? WHERE id = ? AND user_id = ?', [name, id, req.session.userId], (err, result) => {
    if (err) {
      console.error('Error querying database: ' + err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (result.affectedRows === 0) {
      res.json({ status: 'error', message: 'Trainer setup not found or unauthorized' });
      return;
    }
    res.json({ status: 'success', message: 'Trainer setup name changed' });
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

// End of file