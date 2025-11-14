// FILE: server/config/index.js
const path = require('path');
require('dotenv').config();

const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  gro: {
    base: process.env.GRO_API_BASE || '',
    key: process.env.GRO_API_KEY || '',
    model: process.env.GRO_MODEL || 'gpt-resume-1',
    mock: process.env.GRO_MOCK === 'true'
  },
  templatesDir: path.join(__dirname, '..', 'templates'),
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;
