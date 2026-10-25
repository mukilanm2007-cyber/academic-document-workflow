const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const { initializeDatabase } = require('./config/initDb');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    logger.info('Initializing Database Connection and Schema...');
    try {
      await initializeDatabase();
      logger.info('Database initialized successfully.');
    } catch (dbErr) {
      logger.warn(`Database connection failed: ${dbErr.message}`);
      logger.warn('Please ensure MySQL server is running (e.g. run ./start-db.ps1).');
    }

    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} [Mode: ${process.env.NODE_ENV || 'development'}]`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      logger.info('Received shutdown signal. Closing server...');
      server.close(() => {
        logger.info('Server closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
