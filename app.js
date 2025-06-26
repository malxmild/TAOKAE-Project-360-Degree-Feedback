const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const pool = require('./models/db');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

const userRoutes = require('./routes/users');
const evaluationsRoutes = require('./routes/evaluations');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/evaluation_relations', evaluationsRoutes);

// Routes
app.use('/api/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
