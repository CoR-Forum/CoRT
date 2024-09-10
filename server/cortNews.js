const express = require('express');
const router = express.Router();
const db = require('./dbInit');
const logger = require('./winston');
const checkAuth = require('./middleware/checkAuth');

// cort news table
db.query(`CREATE TABLE IF NOT EXISTS cort_news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`, (err, result) => {
    if (err) {
      logger.error('Error creating cort_news table:', err);
      throw err;
    }
    logger.info('Table cort_news created or updated');
  });

// Get all cort news
router.get('/cort/news', (req, res) => {
  db.query('SELECT * FROM cort_news ORDER BY created_at DESC', (err, result) => {
    if (err) {
      logger.error('Error getting cort news:', err);
      res.status(500).send(err);
      return;
    }
    res.send(result);
  });
});

// Get cort news by id
router.get('/cort/news/:id', (req, res) => {
  db.query('SELECT * FROM cort_news WHERE id = ?', req.params.id, (err, result) => {
    if (err) {
      logger.error('Error getting cort news by id:', err);
      res.status(500).send(err);
      return;
    }
    res.send(result);
  });
});

module.exports = router;