const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Add this line
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();

// CORS Middleware (MUST go before routes)
app.use(cors({
  origin: '*', // or 'http://localhost:8081' if you want to restrict
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


