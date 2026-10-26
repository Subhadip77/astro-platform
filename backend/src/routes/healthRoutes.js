const express = require('express');
const db = require('../db');
const { config } = require('../config');

const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const result = await db.query('SELECT 1 as is_alive;');
    if (result && result.length > 0) {
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = `error: ${error.message}`;
  }

  const isHealthy = dbStatus === 'connected';

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    environment: config.server.nodeEnv,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      api: 'operational',
    },
  });
});

module.exports = router;
