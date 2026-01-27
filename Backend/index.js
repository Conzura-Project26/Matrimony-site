import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SarvVivah Backend API',
    version: '1.0.0',
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
});
