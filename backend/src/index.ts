import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config, { validateProductionConfig } from './config';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import userService from './services/user';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later',
    statusCode: 429,
  },
});
app.use('/api', limiter);

// More strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    error: 'Too Many Attempts',
    message: 'Too many login attempts, please try again later',
    statusCode: 429,
  },
});
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (unauthenticated)
app.get('/health', (_req, res) => res.json({ 
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    statusCode: 404,
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.env === 'development' ? err.message : 'An unexpected error occurred',
    statusCode: 500,
  });
});

// Initialize default users and start server
async function startServer() {
  // Validate production configuration
  if (config.env === 'production') {
    validateProductionConfig(config);
  }

  // Initialize default staff users for development
  if (config.env !== 'production') {
    await userService.initializeDefaultUser();
  }

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.env} mode`);
    console.log(`Health check: http://localhost:${config.port}/health`);
  });
}

startServer().catch(console.error);

export default app;
