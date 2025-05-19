const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Create a new user
router.post('/add-user', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, email, password, address, role } = req.body;
  if (!name || !email || !password || !address || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const [result] = await db.query(
    'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, password, address, role]
  );
  res.json({ message: 'User added successfully' });
});

// Create a new store
router.post('/add-store', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, email, address } = req.body;
  if (!name || !email || !address) {
    return res.status(400).json({ message: 'All fields required' });
  }
  await db.query(
    'INSERT INTO stores (name, email, address) VALUES (?, ?, ?)',
    [name, email, address]
  );
  res.json({ message: 'Store added successfully' });
});

// Dashboard stats
router.get('/dashboard', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const [[userCount]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
  const [[storeCount]] = await db.query('SELECT COUNT(*) AS totalStores FROM stores');
  const [[ratingCount]] = await db.query('SELECT COUNT(*) AS totalRatings FROM ratings');
  res.json({ ...userCount, ...storeCount, ...ratingCount });
});

// Get users with optional filters
router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name = '', email = '', address = '', role = '' } = req.query;
  const [users] = await db.query(
    `SELECT id, name, email, address, role FROM users 
     WHERE name LIKE ? AND email LIKE ? AND address LIKE ? AND role LIKE ?`,
    [`%${name}%`, `%${email}%`, `%${address}%`, `%${role}%`]
  );
  res.json(users);
});

// Get store list with ratings
router.get('/stores', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const [stores] = await db.query(
    `SELECT s.id, s.name, s.email, s.address, ROUND(AVG(r.rating), 2) AS rating 
     FROM stores s
     LEFT JOIN ratings r ON s.id = r.store_id
     GROUP BY s.id`
  );
  res.json(stores);
});

module.exports = router;
