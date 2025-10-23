import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { createPool, closePool } from './database/connection';
import { requestLogger, errorLogger } from './middleware/logging';
import { CollaborationService } from './services/CollaborationService';
import apiRoutes from './routes';

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLogger);

// API routes
app.use('/api', apiRoutes);

// Serve static files in production
if (config.nodeEnv === 'production') {
  app.use(express.static('public'));
  
  // Catch-all handler for SPA
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
  });
}

// Error handling middleware
app.use(errorLogger);
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    error: config.nodeEnv === 'production' ? 'Internal server error' : error.message,
    ...(config.nodeEnv === 'development' && { stack: error.stack }),
  });
});

// Initialize database connection
const initializeDatabase = async () => {
  try {
    const pool = createPool();
    console.log('Database connection pool created');
    
    // Test the connection
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await closePool();
    console.log('Database connections closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Initialize collaboration service
    const collaborationService = new CollaborationService(httpServer);
    console.log('Real-time collaboration service initialized');
    
    const server = httpServer.listen(config.port, config.host, () => {
      console.log(`
🚀 Intelligent Engineering Platform 2.0 API Server
📍 Running on: http://${config.host}:${config.port}
🌍 Environment: ${config.nodeEnv}
📊 Health Check: http://${config.host}:${config.port}/api/health
📚 API Info: http://${config.host}:${config.port}/api/info
🔄 Real-time Collaboration: WebSocket enabled
      `);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();