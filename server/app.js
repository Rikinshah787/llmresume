// FILE: server/app.js
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const initSockets = require('./sockets');
const resumeRoutes = require('./routes/resumeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userLogger = require('./services/userLogger');

const app = express();
const server = http.createServer(app);

app.set('config', config);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
if (config.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}
app.use(cors({ origin: config.corsOrigin, credentials: true }));

// uid cookie middleware: ensure each HTTP request has uid cookie
app.use((req, res, next) => {
  let uid = req.cookies?.uid;
  if (!uid) {
    uid = uuidv4();
    res.cookie('uid', uid, { httpOnly: false, sameSite: 'lax' });
  }
  req.uid = uid;
  // Record uid for server-side unique visitor tracking and logging
  try { userLogger.recordUid(uid); } catch (err) { console.error('userLogger error:', err?.message || err); }
  next();
});

// serve static public folder (optional)
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/resume', resumeRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, env: config.nodeEnv }));

// Metrics endpoints for unique and active users
app.get('/api/metrics/unique', (req, res) => {
  try {
    res.json({ unique: userLogger.getUniqueCount() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get unique count' });
  }
});

app.get('/api/metrics/active', (req, res) => {
  try {
    res.json({ active: userLogger.getActiveCount() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get active count' });
  }
});

// error handler
app.use((err, req, res, next) => {
  console.error('Error handler:', err.message || err);
  const status = err.status || 500;
  const payload = { error: err.message || 'Internal Server Error' };
  if (err.errors) payload.errors = err.errors;
  res.status(status).json(payload);
});

// start sockets
const sockets = initSockets(server, app);
app.set('sockets', sockets);

server.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
