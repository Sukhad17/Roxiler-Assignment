const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');


const { validateRegistration } = require('../middleware/validateInput');
const { validationResult } = require('express-validator');

router.post('/register', validateRegistration, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  // Your original registration logic
  const { name, email, password, address } = req.body;

  // Check if user already exists
  const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (existingUser.length > 0) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.query(
    'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashedPassword, address, 'user']
  );

  res.status(201).json({ message: 'User registered successfully' });
});




// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      'mySuperSecretKey12345!',
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected route
router.get('/protected-route', authMiddleware, (req, res) => {
  res.json({
    message: 'You accessed a protected route!',
    userId: req.user.id,
    role: req.user.role,
  });
});

// Test route
router.get('/test', (req, res) => {
  console.log('Test route was called!');
  res.send('🔧 Test route working');
});


// Rate a store (Step 9)
router.post('/stores/:storeId/rate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = parseInt(req.params.storeId, 10);
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Optional: check if store exists
    const storeCheck = await pool.query('SELECT * FROM stores WHERE id = $1', [storeId]);
    if (storeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    // Optional: update if rating already exists
    const existingRating = await pool.query(
      'SELECT * FROM ratings WHERE user_id = $1 AND store_id = $2',
      [userId, storeId]
    );

    let result;
    if (existingRating.rows.length > 0) {
      result = await pool.query(
        'UPDATE ratings SET rating = $1, created_at = NOW() WHERE user_id = $2 AND store_id = $3 RETURNING *',
        [rating, userId, storeId]
      );
    } else {
      result = await pool.query(
        'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING *',
        [userId, storeId, rating]
      );
    }

    res.json({ message: 'Rating submitted successfully!', rating: result.rows[0] });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: 'Server error while rating.' });
  }
});


// Admin-only: Get all ratings (with optional filters)
router.get('/ratings', authMiddleware, async (req, res) => {
  try {
    const { userId, storeId } = req.query;

    // Ensure only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    // Build dynamic query
    let baseQuery = 'SELECT * FROM ratings';
    let where = [];
    let params = [];

    if (userId) {
      where.push(`user_id = $${params.length + 1}`);
      params.push(userId);
    }

    if (storeId) {
      where.push(`store_id = $${params.length + 1}`);
      params.push(storeId);
    }

    if (where.length > 0) {
      baseQuery += ' WHERE ' + where.join(' AND ');
    }

    const result = await pool.query(baseQuery, params);

    res.json({ count: result.rows.length, ratings: result.rows });
  } catch (error) {
    console.error('Fetch ratings error:', error);
    res.status(500).json({ error: 'Server error while fetching ratings' });
  }
});


router.put('/users/password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input presence
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required.' });
    }

    // Validate new password (8-16 chars, at least one uppercase & special char)
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'New password must be 8-16 characters and include at least one uppercase letter and one special character.' });
    }

    // Get user from DB
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Server error while updating password.' });
  }
});


router.get('/store-owner/raters', authMiddleware, roleMiddleware(['store_owner']), async (req, res) => {
  try {
    const storeOwnerId = req.user.id;

    // Get the store owned by this user
    const storeResult = await pool.query('SELECT * FROM stores WHERE owner_id = $1', [storeOwnerId]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found for this owner.' });
    }
    const store = storeResult.rows[0];

    // Get users who rated this store
    const ratersResult = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, u.address
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
    `, [store.id]);

    res.json({ store: store.name, raters: ratersResult.rows });
  } catch (error) {
    console.error('Store owner raters error:', error);
    res.status(500).json({ error: 'Server error fetching raters.' });
  }
});


router.get('/store-owner/average-rating', authMiddleware, roleMiddleware(['store_owner']), async (req, res) => {
  try {
    const storeOwnerId = req.user.id;

    // Get the store owned by this user
    const storeResult = await pool.query('SELECT * FROM stores WHERE owner_id = $1', [storeOwnerId]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found for this owner.' });
    }
    const store = storeResult.rows[0];

    // Get average rating
    const avgResult = await pool.query(`
      SELECT AVG(rating) as average_rating
      FROM ratings
      WHERE store_id = $1
    `, [store.id]);

    res.json({ store: store.name, averageRating: avgResult.rows[0].average_rating || 0 });
  } catch (error) {
    console.error('Store owner average rating error:', error);
    res.status(500).json({ error: 'Server error fetching average rating.' });
  }
});



router.get('/admin/summary', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalStoresResult = await pool.query('SELECT COUNT(*) FROM stores');
    const totalRatingsResult = await pool.query('SELECT COUNT(*) FROM ratings');

    res.json({
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      totalStores: parseInt(totalStoresResult.rows[0].count),
      totalRatings: parseInt(totalRatingsResult.rows[0].count)
    });
  } catch (error) {
    console.error('Admin summary error:', error);
    res.status(500).json({ error: 'Server error retrieving dashboard summary' });
  }
});


router.get('/admin/users', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { name, email, address, role, sortBy = 'id', order = 'asc' } = req.query;

    // Valid fields to sort
    const validSortFields = ['name', 'email', 'address', 'role', 'id'];
    const validOrder = ['asc', 'desc'];

    // Validate input
    if (!validSortFields.includes(sortBy) || !validOrder.includes(order.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid sort parameters' });
    }

    // Build WHERE clause based on filters
    const conditions = [];
    const values = [];

    if (name) {
      values.push(`%${name}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }
    if (email) {
      values.push(`%${email}%`);
      conditions.push(`email ILIKE $${values.length}`);
    }
    if (address) {
      values.push(`%${address}%`);
      conditions.push(`address ILIKE $${values.length}`);
    }
    if (role) {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT id, name, email, address, role
      FROM users
      ${whereClause}
      ORDER BY ${sortBy} ${order.toUpperCase()}
    `;

    const result = await pool.query(query, values);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Admin user listing error:', error);
    res.status(500).json({ error: 'Server error retrieving users' });
  }
});


router.get('/admin/stores', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { name, email, address, sortBy = 'name', order = 'asc' } = req.query;

    const validSortFields = ['name', 'email', 'address', 'average_rating'];
    const validOrder = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy) || !validOrder.includes(order.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid sort parameters' });
    }

    // Build filters
    const conditions = [];
    const values = [];

    if (name) {
      values.push(`%${name}%`);
      conditions.push(`s.name ILIKE $${values.length}`);
    }
    if (email) {
      values.push(`%${email}%`);
      conditions.push(`s.email ILIKE $${values.length}`);
    }
    if (address) {
      values.push(`%${address}%`);
      conditions.push(`s.address ILIKE $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query with LEFT JOIN for average rating per store
    const query = `
      SELECT s.id, s.name, s.email, s.address,
             COALESCE(AVG(r.rating), 0) AS average_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY ${sortBy === 'average_rating' ? 'average_rating' : `s.${sortBy}`} ${order.toUpperCase()}
    `;

    const result = await pool.query(query, values);

    res.json({ stores: result.rows });
  } catch (error) {
    console.error('Admin store listing error:', error);
    res.status(500).json({ error: 'Server error retrieving stores' });
  }
});


router.post('/admin/users', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { name, email, address, password, role } = req.body;

    // Validate all fields present
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Validate role
    const validRoles = ['admin', 'normal_user', 'store_owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    // Password validation: 8-16 chars, at least 1 uppercase, 1 special char
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Password must be 8-16 chars, include 1 uppercase and 1 special char.' });
    }

    // Check if email already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role',
      [name, email, hashedPassword, address, role]
    );

    res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
});



router.post('/admin/stores', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { name, email, address, owner_id } = req.body;

    // Validate required fields
    if (!name || !email || !address || !owner_id) {
      return res.status(400).json({ error: 'Name, email, address, and owner_id are required.' });
    }

    // Check if owner_id exists and role is store_owner
    const ownerCheck = await pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', [owner_id, 'store_owner']);
    if (ownerCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid owner_id or user is not a store owner.' });
    }

    // Check if store email already exists
    const existingStore = await pool.query('SELECT * FROM stores WHERE email = $1', [email]);
    if (existingStore.rows.length > 0) {
      return res.status(400).json({ error: 'Store email already registered.' });
    }

    // Insert new store
    const result = await pool.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, address, owner_id',
      [name, email, address, owner_id]
    );

    res.status(201).json({ message: 'Store created successfully', store: result.rows[0] });
  } catch (error) {
    console.error('Admin create store error:', error);
    res.status(500).json({ error: 'Server error creating store' });
  }
});


router.get('/admin/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user info
    const userResult = await pool.query('SELECT id, name, email, address, role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // If user is store_owner, get average rating of their store(s)
    if (user.role === 'store_owner') {
      const ratingResult = await pool.query(`
        SELECT COALESCE(AVG(r.rating), 0) AS average_rating
        FROM stores s
        LEFT JOIN ratings r ON s.id = r.store_id
        WHERE s.owner_id = $1
      `, [userId]);

      user.average_rating = parseFloat(ratingResult.rows[0].average_rating);
    }

    res.json({ user });
  } catch (error) {
    console.error('Admin detailed user info error:', error);
    res.status(500).json({ error: 'Server error fetching user info' });
  }
});


router.get('/admin/stores/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const storeId = req.params.id;

    // Get store basic info + owner info
    const storeResult = await pool.query(`
      SELECT 
        s.id, s.name, s.email, s.address,
        u.id AS owner_id, u.name AS owner_name, u.email AS owner_email
      FROM stores s
      JOIN users u ON s.owner_id = u.id
      WHERE s.id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const store = storeResult.rows[0];

    // Get list of ratings with rater info
    const ratingsResult = await pool.query(`
      SELECT 
        r.rating, r.user_id,
        u.name AS user_name, u.email AS user_email
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
    `, [storeId]);

    store.ratings = ratingsResult.rows;

    res.json({ store });
  } catch (error) {
    console.error('Admin store detail error:', error);
    res.status(500).json({ error: 'Server error fetching store details' });
  }
});


router.put('/update-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required.' });
    }

    // Validate new password: 8-16 characters, 1 uppercase, 1 special char
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'New password must be 8-16 characters and include 1 uppercase and 1 special character.'
      });
    }

    // Get current user from DB
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Server error updating password' });
  }
});



module.exports = router;
