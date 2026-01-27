import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './src/routes/auth.js';
import masterDataRoutes from './src/routes/masterData.js';
import prisma from './src/config/prisma.js';
import swaggerSpec from './src/config/swagger.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Swagger Documentation (only in development/staging)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SarvVivah API Docs',
  }));
  console.log('📚 Swagger documentation available at /api-docs');
}

// Routes
app.use('/auth', authRoutes);
app.use('/master', masterDataRoutes);

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
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Check database connection
  try {
    await prisma.$connect();
    console.log('✓ Connected to database');
  } catch (error) {
    console.error('✗ Failed to connect to database:');
    console.error(error.message);
  }
});
