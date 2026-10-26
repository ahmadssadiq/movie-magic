import express from 'express';
import cors from 'cors';
import searchRoutes from './routes/search.js';
import listRoutes from './routes/lists.js';
import detailsRoutes from './routes/details.js';
import { requireAuth } from './middleware/auth.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    uid: req.user.uid,
    email: req.user.email || null
  });
});

app.use('/api', searchRoutes);
app.use('/api', listRoutes);
app.use('/api', detailsRoutes);

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Any error thrown in a route ends up here
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Something went wrong' });
});

export default app;
