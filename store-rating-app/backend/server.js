const express = require('express');
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/user')
const adminRoutes = require('./routes/admin');
const ownerRoutes = require('./routes/owner');


const authRoutes = require('./routes/auth');

app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);


app.use(cors());
app.use(express.json());
app.use(userRoutes)

app.use('/api', authRoutes);

app.get('/', (req, res) => {
  res.send('✅ Server is running. Use /api/register and /api/login');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

router.post('/api/signup', async (req, res) => {
  const { name, email, address, password } = req.body

  try {
    // Check if user exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new user
    await pool.query(
      'INSERT INTO users (name, email, address, password, role) VALUES ($1, $2, $3, $4, $5)',
      [name, email, address, hashedPassword, 'user'] // default role as "user"
    )

    res.status(201).json({ message: 'User registered successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router