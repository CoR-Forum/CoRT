const express = require('express');
const db = require('./dbInit');
const logger = require('./winston');
const checkAuth = require('./middleware/checkAuth');

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

const router = express.Router();

const API_PATH = process.env.API_PATH || '/api/v1';

router.get('/trainer/mysetups', checkAuth, (req, res) => {
    db.query('SELECT * FROM trainer_setups WHERE user_id = ?', [req.session.userId], (err, result) => {
        if (err) {
            logger.error('Error querying database: ' + err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.send(result);
    });
});

router.get('/trainer/setups', (req, res) => {
    db.query('SELECT trainer_setups.*, users.nickname, users.id AS user_id FROM trainer_setups JOIN users ON trainer_setups.user_id = users.id WHERE is_public = TRUE', (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.send(result);
    });
});

// create trainer setup
router.post('/trainer/setup', checkAuth, (req, res) => {
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


// retrieve the rating and recommendations of the trainer setup for the logged-in user
router.get('/trainer/myratings/:id', checkAuth, (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM trainer_setup_ratings WHERE trainer_setup_id = ? AND user_id = ?', [id, req.session.userId], (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      const ratingData = result.length === 0 ? { rating: 0.00, recommendation: 0, review: '' } : result[0];
      res.json(ratingData);
    });
  });
  
  // update the rating and the recommendations of the trainer setup. if the user has already rated the setup, update the rating, else insert a new rating.
  router.post('/trainer/rate/:id', checkAuth, (req, res) => {
    const id = req.params.id;
    const { rating, recommendation, review } = req.body;
    logger.info('Rating trainer setup: ' + id, rating, recommendation, review);
    
    db.query('SELECT user_id FROM trainer_setups WHERE id = ?', [id], (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      const ownerId = result[0].user_id;
      
      if (req.session.userId === ownerId) {
        res.json({ status: 'error', message: 'You cannot rate your own trainer setup' });
        return;
      }
      
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
  router.delete('/trainer/rate/:id', checkAuth, (req, res) => {
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
  router.get('/trainer/ratings/:id', (req, res) => {
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
  router.delete('/trainer/mysetups/:id', checkAuth, (req, res) => {
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
  router.put('/trainer/mysetups/:id/status', checkAuth, (req, res) => {
    const id = req.params.id;
    const is_public = req.body.is_public;
    logger.info('Changing public status of trainer setup: ' + id, is_public);
    db.query('UPDATE trainer_setups SET is_public = ? WHERE id = ? AND user_id = ?', [is_public, id, req.session.userId], (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        return res.status(500).send('Internal Server Error');
      }
      if (result.affectedRows === 0) {
        return res.json({ status: 'error', message: 'Trainer setup not found or unauthorized' });
      }
      res.json({ status: 'success', message: 'Trainer setup public status changed' });
    });
  });
  
  // change name of own trainer setup
  router.put('/trainer/mysetups/:id/name', checkAuth, (req, res) => {
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

module.exports = router;
