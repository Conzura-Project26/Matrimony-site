/**
 * CORS Configuration
 * Cross-Origin Resource Sharing setup for the API
 */

/**
 * CORS options configuration
 */
const corsOptions = {
  // Allow all origins for now (development)
  // In production, replace with specific allowed origins
  origin: true, // Allows all origins
  
  // Alternative for production (uncomment and configure):
  // origin: function (origin, callback) {
  //   const allowedOrigins = [
  //     'http://localhost:3000',
  //     'http://localhost:5173', // Vite
  //     'https://yourdomain.com',
  //     'https://www.yourdomain.com',
  //   ];
  //   
  //   // Allow requests with no origin (mobile apps, Postman, etc.)
  //   if (!origin) return callback(null, true);
  //   
  //   if (allowedOrigins.indexOf(origin) !== -1) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error('Not allowed by CORS'));
  //   }
  // },

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],

  // Expose these headers to the client
  exposedHeaders: ['Content-Range', 'X-Content-Range'],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Cache preflight requests for 24 hours
  maxAge: 86400,

  // Allow preflight to succeed
  preflightContinue: false,

  // Successful OPTIONS requests return 204
  optionsSuccessStatus: 204,
};

export default corsOptions;
