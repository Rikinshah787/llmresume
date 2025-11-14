// FILE: server/services/templateService.js
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

function sanitizeId(id) {
  if (!id) return null;
  if (/^[a-zA-Z0-9\-_]+$/.test(id)) return id;
  return null;
}

async function loadTemplate(id) {
  const safe = sanitizeId(id);
  if (!safe) throw new Error('Invalid template id');
  const file = path.join(config.templatesDir, `${safe}.tex`);
  // Prevent directory traversal by ensuring path starts with templatesDir
  if (!file.startsWith(config.templatesDir)) throw new Error('Invalid template path');
  const content = await fs.readFile(file, 'utf8');
  return content;
}

module.exports = { loadTemplate, sanitizeId };
