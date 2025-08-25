import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Surreal } from 'surrealdb';
import { parseCliArgs } from './config/config';
import { DatabaseManager } from './utils/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';

interface AuthenticatedRequest extends Request {
  db: Surreal;
}

async function main() {
  try {
    const config = parseCliArgs();
    
    // Initialize database
    const dbManager = new DatabaseManager({
      url: config.surrealUrl,
      user: config.surrealUser,
      password: config.surrealPass,
      namespace: config.surrealNamespace,
      database: config.surrealDatabase,
    });

    const db = await dbManager.connect();

    // Create Express app
    const app = express();

    // Middleware
    app.use(cors({
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: '*'
    }));

    app.use(express.json({ limit: '50mb' }));

    // Database middleware - attach db to all requests
    app.use((req: Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedRequest;
      authReq.db = db;
      next();
    });

    // Routes
    app.use('/auth', authRoutes);

    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Error handling middleware
    app.use(errorHandler);

    // Start server
    const server = app.listen(config.port, config.bind, () => {
      logger.info(`🚀 Server running at http://${config.bind}:${config.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('🛑 Shutdown signal received, stopping server...');
      server.close(async () => {
        await dbManager.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('🛑 Shutdown signal received, stopping server...');
      server.close(async () => {
        await dbManager.close();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});