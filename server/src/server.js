import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';

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

// Enable CORS for dev and frontend clients
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// Request logger for visibility
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// API Routes
app.use('/api/police', policeRouter);
app.use('/api/criminals', criminalsRouter);
app.use('/api/court-records', courtRecordsRouter);
app.use('/api/jail', jailRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/queries', queriesRouter);
app.use('/api/sql', sqlConsoleRouter);
app.use('/api/search', searchRouter);

// Health check endpoint
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
  res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown error') });
});

app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(` Criminal Record Management System - Backend `);
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(`===============================================`);
  await testConnection();
});
