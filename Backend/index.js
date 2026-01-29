import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './src/routes/auth.js';
import masterDataRoutes from './src/routes/masterData.js';
import profileRoutes from './src/routes/profile.js';
import userProfileRoutes from './src/routes/userProfile.js';
import testErrorRoutes from './src/routes/testErrors.js';
import prisma from './src/config/prisma.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import requestLogger from './src/middleware/requestLogger.js';
import logger from './src/config/logger.js';
import corsOptions from './src/config/corsConfig.js';
import helmetConfig from './src/config/helmetConfig.js';
import { globalRateLimiter, authRateLimiter } from './src/middleware/rateLimiter.js';
import { sanitizeInput } from './src/middleware/sanitization.js';
import swaggerSpec from './src/config/swagger.js';

dotenv.config();

const app = express();

// ============================
// Security Middleware (FIRST)
// ============================

// 1. Helmet - Security headers
app.use(helmetConfig);

// 2. CORS - Cross-Origin Resource Sharing
app.use(cors(corsOptions));

// 3. Rate Limiting - Global rate limiter
app.use(globalRateLimiter);

// 4. Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Input Sanitization - Protect against NoSQL injection & XSS
app.use(sanitizeInput);

// 6. Request Logging
app.use(requestLogger);

// ============================
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
// ============================

// Auth routes with stricter rate limiting
app.use('/auth', authRateLimiter, authRoutes);
app.use('/master', masterDataRoutes);
app.use('/users', profileRoutes);
app.use('/users', userProfileRoutes);

// Test routes (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use('/test-errors', testErrorRoutes);
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SarvVivah Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Handler - Must be after all routes
app.use(notFoundHandler);

// Global Error Handler - Must be last
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  logger.info(`Server started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  
  // Check database connection
  try {
    await prisma.$connect();
    logger.info('Database connected successfully', {
      type: 'PostgreSQL',
      host: 'Supabase',
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
      stack: error.stack,
    });
  }
});
