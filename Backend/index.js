import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './src/routes/auth.js';
import masterDataRoutes from './src/routes/masterData.js';
import testErrorRoutes from './src/routes/testErrors.js';
import userRoutes from './src/routes/userRoutes.js';
import adminRoutes from './src/routes/admin.js';
import searchRoutes from './src/routes/search.js';
import profileListingRoutes from './src/routes/profileListing.js';
import matchmakingRoutes from './src/routes/matchmaking.js';
import viewRoutes from './src/routes/viewRoutes.js';
import shortlistRoutes from './src/routes/shortlistRoutes.js';
import interestRoutes from './src/routes/interestRoutes.js';
import blockRoutes from './src/routes/blockRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import planRoutes from './src/routes/plans.js';
import subscriptionRoutes from './src/routes/subscriptionRoutes.js';
import prisma from './src/config/prisma.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import requestLogger from './src/middleware/requestLogger.js';
import { captureAuditContext } from './src/middleware/auditContext.js';
import logger from './src/config/logger.js';
import corsOptions from './src/config/corsConfig.js';
import helmetConfig from './src/config/helmetConfig.js';
import { globalRateLimiter, authRateLimiter } from './src/middleware/rateLimiter.js';
import { sanitizeInput } from './src/middleware/sanitization.js';
import swaggerSpec from './src/config/swagger.js';
import { initializeCronJobs } from './src/config/cronJobs.js';

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

// 7. Audit Context - Capture IP and User Agent for audit logging (Phase 5 - Task 5.6)
app.use(captureAuditContext);

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
app.use('/plans', planRoutes); // Subscription plans (Task 6.1): GET /plans, GET /plans/:id, GET /plans/code/:code
app.use('/subscriptions', subscriptionRoutes); // User subscriptions (Task 6.2): GET /subscriptions/current, POST /subscriptions/subscribe
app.use('/users', userRoutes); // Combined user routes (photos, personal, caste, education, professional, family, horoscope, preferences)
app.use('/profiles', profileListingRoutes); // Profile listing with advanced filters (Task 3.1)
app.use('/search', searchRoutes); // Search & matchmaking routes
app.use('/', matchmakingRoutes); // Matchmaking routes (Task 3.4): /profiles/recommended, /profiles/daily-matches, /matches/:id/view
app.use('/', viewRoutes); // Profile view tracking (Task 3.5): POST /profiles/:id/view, GET /profile/viewers, GET /profile/viewed
app.use('/', shortlistRoutes); // Shortlist management (Task 3.6): POST /shortlist/:userId, DELETE /shortlist/:userId, GET /shortlist, GET /shortlist/:userId/status, GET /shortlisted-by
app.use('/', interestRoutes); // Interest system (Task 4.1): POST /interests/:receiverId
app.use('/blocks', blockRoutes); // Blocking system (Task 4.x): POST /blocks/:userId, DELETE /blocks/:userId, GET /blocks
app.use('/messages', messageRoutes); // Messaging system (Task 4.3): POST /messages/:userId, GET /messages/:userId, GET /messages/conversations
app.use('/notifications', notificationRoutes); // Notification system (Task 4.6): GET /notifications, PUT /notifications/:id/read, etc.
app.use('/reports', reportRoutes); // User reporting system (Task 5.5): POST /reports/:userId, GET /reports/reasons, GET /reports/my-reports
app.use('/admin', adminRoutes);

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

// Export app for testing
export default app;

// Start server only if this file is run directly
// Fixed for Windows compatibility
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) || 
                     import.meta.url.includes('index.js');

if (isMainModule) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`✓ Server listening on http://localhost:${PORT}`);
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

    // Initialize cron jobs (Task 4.6)
    try {
      initializeCronJobs();
      logger.info('Cron jobs initialized successfully');
    } catch (error) {
      logger.error('Cron jobs initialization failed', {
        error: error.message,
        stack: error.stack,
      });
    }
  });
}
