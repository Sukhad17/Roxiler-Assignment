const express = require('express')
const bcrypt = require('bcryptjs')
const router = express.Router()

// Dummy DB connection simulation - replace with your real DB code
const users = []  // for demo only, use PostgreSQL in real app

// Signup route
router.post('/api/signup', async (req, res) => {
  const { name, email, address, password } = req.body

  // Simple validation
  if (!name || !email || !address || !password) {
    return res.status(400).json({ message: 'Please fill all fields' })
  }

  // Check if user exists
  const userExists = users.find(user => user.email === email)
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Save user (in memory, replace with DB insert)
  users.push({ name, email, address, password: hashedPassword, role: 'user' })

  res.status(201).json({ message: 'User registered successfully' })
})

// Update an existing rating
router.put('/rate/:storeId', authenticateToken, authorizeRoles('user'), async (req, res) => {
  const { rating } = req.body;
  const storeId = req.params.storeId;

  const [existing] = await db.query(
    'SELECT * FROM ratings WHERE user_id = ? AND store_id = ?',
    [req.user.id, storeId]
  );

  if (!existing.length) {
    return res.status(404).json({ message: 'No existing rating found to update' });
  }

  await db.query(
    'UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?',
    [rating, req.user.id, storeId]
  );

  res.json({ message: 'Rating updated successfully' });
});


module.exports = router
