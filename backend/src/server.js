const http = require('node:http');
const app = require('./app');
const { config } = require('./config');
const db = require('./db');

const port = config.server.port || 5000;
const server = http.createServer(app);

server.listen(port, () => {
  console.log('====================================================');
  console.log(`  ASTRO PLATFORM BACKEND STARTED                    `);
  console.log('====================================================');
  console.log(`  Environment: ${config.server.nodeEnv}`);
  console.log(`  Listening on: http://localhost:${port}`);
  console.log(`  API Base:     http://localhost:${port}/api/v1`);
  console.log(`  Health Check: http://localhost:${port}/api/v1/health`);
  console.log('====================================================');
});

function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await db.closePool();
      console.log('Database connection pool closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
