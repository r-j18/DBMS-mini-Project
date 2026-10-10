import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import { csrfProtection } from './middleware/security.js';
import { requireAuth } from './middleware/auth.js';

// Route imports
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import auditLogRouter from './routes/auditLog.js';
import policeRouter from './routes/police.js';
import criminalsRouter from './routes/criminals.js';
import courtRecordsRouter from './routes/courtRecords.js';
import jailRouter from './routes/jail.js';
import dashboardRouter from './routes/dashboard.js';
import queriesRouter from './routes/queries.js';
import sqlConsoleRouter from './routes/sqlConsole.js';
import searchRouter from './routes/search.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers via helmet
app.use(helmet());

// CORS configuration restricted to dev client with credentials
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl or internal test requests)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Basic CSRF protection: state-changing requests must include custom header
app.use(csrfProtection);

// Request logger for audit visibility
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// Authentication routes (login is public; logout/me/change-password handled internally)
app.use('/api/auth', authRouter);

// Protected routes (requireAuth applied to all other /api routes)
app.use('/api/police', requireAuth, policeRouter);
app.use('/api/criminals', requireAuth, criminalsRouter);
app.use('/api/court-records', requireAuth, courtRecordsRouter);
app.use('/api/jail', requireAuth, jailRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/queries', requireAuth, queriesRouter);
app.use('/api/sql', requireAuth, sqlConsoleRouter);
app.use('/api/search', requireAuth, searchRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/audit-log', requireAuth, auditLogRouter);

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.message && err.message.includes('CORS') ? 403 : 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === undefined) {
  app.listen(PORT, async () => {
    console.log(`===============================================`);
    console.log(` Criminal Record Management System - Backend `);
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` Security: Helmet, CSRF protection, RBAC, JWT`);
    console.log(`===============================================`);
    await testConnection();
  });
}

export default app;
