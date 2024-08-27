const express = require('express');
const router = express.Router();
const db = require('./dbInit'); // Adjust the path as necessary
// const logger = require('./logger'); // Adjust the path as necessary

router.get('/user/email/verify/:email_verification_key', (req, res) => {
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

module.exports = router;