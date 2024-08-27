const express = require('express');
const db = require('./dbInit');
const logger = require('./winston');
const checkAuth = require('./middleware/checkAuth');

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

router.get(API_PATH + '/trainer/setups', (req, res) => {
    db.query('SELECT trainer_setups.*, users.nickname, users.id AS user_id FROM trainer_setups JOIN users ON trainer_setups.user_id = users.id WHERE is_public = TRUE', (err, result) => {
      if (err) {
        logger.error('Error querying database: ' + err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.send(result);
    });
});

module.exports = router;
