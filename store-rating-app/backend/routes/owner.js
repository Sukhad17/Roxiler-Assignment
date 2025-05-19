const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get users who rated the owner's store
router.get('/ratings', authenticateToken, authorizeRoles('store_owner'), async (req, res) => {
  const [store] = await db.query('SELECT id FROM stores WHERE email = ?', [req.user.email]);
  if (!store.length) return res.status(404).json({ message: 'Store not found for this owner' });

  const storeId = store[0].id;
  const [ratings] = await db.query(
    `SELECT u.name, u.email, r.rating 
     FROM ratings r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.store_id = ?`,
    [storeId]
  );
  res.json(ratings);
});

// Get average rating of the store
router.get('/average-rating', authenticateToken, authorizeRoles('store_owner'), async (req, res) => {
  const [store] = await db.query('SELECT id FROM stores WHERE email = ?', [req.user.email]);
  if (!store.length) return res.status(404).json({ message: 'Store not found for this owner' });

  const storeId = store[0].id;
  const [[avg]] = await db.query(
    `SELECT ROUND(AVG(rating), 2) AS averageRating 
     FROM ratings WHERE store_id = ?`,
    [storeId]
  );
  res.json(avg);
});

module.exports = router;
