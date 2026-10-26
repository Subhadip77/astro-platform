const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { config } = require('./config');
const { standardLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or matching client URL
      if (!origin || origin === config.client.appUrl || origin === 'http://localhost:3000') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// 3. Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Rate Limiting for Public Endpoints
app.use('/api/', standardLimiter);

// 5. Mount API v1 Routes
app.use('/api/v1', apiRoutes);

// 6. 404 Handler
app.use(notFoundHandler);

// 7. Global Error Handler
app.use(errorHandler);

module.exports = app;
