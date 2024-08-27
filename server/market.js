const express = require('express');
const router = express.Router();
const db = require('./dbInit');
const logger = require('./winston');
const checkAuth = require('./middleware/checkAuth');

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
    status VARCHAR(255) NOT NULL CHECK (status IN ('active', 'draft', 'sold')),
    currency VARCHAR(255) NOT NULL CHECK (currency IN ('magnanite', 'euro', 'magnat')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    market_id INT NOT NULL,
    user_id INT NOT NULL,
    type VARCHAR(255) NOT NULL CHECK (type IN ('auction', 'static')),
    status VARCHAR(255) NOT NULL,
    sold_at TIMESTAMP,
    buyer_id INT,
    sellType VARCHAR(255) NOT NULL,
    item_type VARCHAR(255) NOT NULL CHECK (item_type IN ('weapon', 'armor', 'jewelry', 'misc', 'magnanite', 'account')),
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
  const defaultMarkets = [
    { name: 'Syrtis', description: 'Market for Syrtis', realm: 'Syrtis' },
    { name: 'Ignis', description: 'Market for Ignis', realm: 'Ignis' },
    { name: 'Alsius', description: 'Market for Alsius', realm: 'Alsius' },
    { name: 'Accounts', description: 'Market for accounts', realm: 'All' }
  ];
  
  defaultMarkets.forEach((market) => {
    db.query('SELECT * FROM markets WHERE name = ?', [market.name], (err, result) => {
      if (err) {
        logger.error('Error checking markets table:', err);
        throw err;
      }
      if (result.length === 0) {
        db.query('INSERT INTO markets (name, description, realm) VALUES (?, ?, ?)', [market.name, market.description, market.realm], (err, result) => {
          if (err) {
            logger.error('Error creating default market:', err);
            throw err;
          }
          logger.info(`Default market for ${market.name} created`);
        });
      } else {
        logger.info(`Default market for ${market.name} already exists`);
      }
    });
  });
  
// create private market
router.put('/market/private_market', checkAuth, (req, res) => {
    logger.info('Creating private market: ' + req.body.name, req.body.description, req.body.realm);
  
    db.query('INSERT INTO private_markets (name, description, realm, user_id) VALUES (?, ?, ?, ?)', [req.body.name, req.body.description, req.body.realm, req.session.userId], (err) => {
      if (err) {
        logger.error('Error inserting private market into database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json({ status: 'success', message: 'Private market created' });
    });
  });
  
  // create an item with type account
  router.put('/market/account', checkAuth, (req, res) => {
    const { name, description, images, price, currency, type, item_type } = req.body;
    const user_id = req.session.userId;
    const status = 'draft';
    const sellType = 'account';
    logger.info('Creating account item: ' + name, description, images, price, currency, type, item_type);
  
    db.query('INSERT INTO market_items (name, description, images, price, currency, market_id, user_id, type, status, sellType, item_type) VALUES (?, ?, ?, ?, ?, (SELECT id FROM markets WHERE name = "Accounts"), ?, ?, ?, ?, ?)', [name, description, images, price, currency, user_id, type, status, sellType, item_type], (err) => {
      if (err) {
        logger.error('Error inserting account item into database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json({ status: 'success', message: 'Account item created' });
    });
  });
  
  // get all items with status active
  router.put('/market/items', (req, res) => {
    db.query('SELECT * FROM market_items WHERE status = "active"', (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.send(result);
    });
  });
  
  // change status of own item
  router.put('/market/item/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    logger.info('Changing status of item ID: ' + id + ' to ' + status);
  
    db.query('SELECT * FROM market_items WHERE id = ?', [id], (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      if (result.length === 0) {
        res.json({ status: 'error', message: 'Item not found' });
        return;
      }
      if (result[0].user_id !== req.session.userId) {
        res.json({ status: 'error', message: 'Unauthorized' });
        return;
      }
      db.query('UPDATE market_items SET status = ? WHERE id = ?', [status, id], (err) => {
        if (err) {
          logger.error('Error updating item in database: ' + err);
          res.status(500).send('Internal Server Error');
          return;
        }
        res.json({ status: 'success', message: 'Item status changed' });
      });
    });
  });

module.exports = router;