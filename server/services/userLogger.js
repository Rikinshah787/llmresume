// FILE: server/services/userLogger.js
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'user_counts.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, 'timestamp,uid,action\n');

class UserLogger {
  constructor() {
    this.unique = new Set();
    this.active = new Map(); // uid -> socket count
    this._loadFromLog();
  }

  _appendLine(line) {
    try {
      fs.appendFileSync(LOG_FILE, line + '\n');
    } catch (err) {
      console.error('Failed to write user log:', err?.message || err);
    }
  }

  _loadFromLog() {
    try {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = content.split('\n').slice(1); // skip header
      for (const l of lines) {
        if (!l) continue;
        const parts = l.split(',');
        const uid = parts[1];
        if (uid) this.unique.add(uid);
      }
    } catch (err) {
      // ignore read errors
    }
  }

  recordUid(uid) {
    if (!uid) return;
    const firstSeen = !this.unique.has(uid);
    if (firstSeen) {
      this.unique.add(uid);
      const line = `${Date.now()},${uid},seen`;
      this._appendLine(line);
    }
  }

  incrementActive(uid) {
    if (!uid) return;
    const prev = this.active.get(uid) || 0;
    this.active.set(uid, prev + 1);
    // log active change for debugging
    this._appendLine(`${Date.now()},${uid},connect`);
  }

  decrementActive(uid) {
    if (!uid) return;
    const prev = this.active.get(uid) || 0;
    if (prev <= 1) this.active.delete(uid);
    else this.active.set(uid, prev - 1);
    this._appendLine(`${Date.now()},${uid},disconnect`);
  }

  getUniqueCount() {
    return this.unique.size;
  }

  getActiveCount() {
    return this.active.size;
  }

  getUniqueList() {
    return Array.from(this.unique);
  }
}

module.exports = new UserLogger();
