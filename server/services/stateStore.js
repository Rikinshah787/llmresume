// FILE: server/services/stateStore.js
const { v4: uuidv4 } = require('uuid');

/**
 * In-memory state store keyed by uid.
 * Structure per user:
 * {
 *   currentTex: string,
 *   pendingTex: string|null,
 *   history: [{ ts: number, type: 'accept'|'decline'|'seed', details?: any }]
 * }
 */
class StateStore {
  constructor() {
    this.store = new Map();
  }

  ensure(uid) {
    if (!uid) uid = uuidv4();
    if (!this.store.has(uid)) {
      this.store.set(uid, {
        currentTex: '',
        pendingTex: null,
        history: []
      });
    }
    return this.store.get(uid);
  }

  get(uid) {
    return this.store.get(uid) || null;
  }

  seedCurrent(uid, tex) {
    const s = this.ensure(uid);
    s.currentTex = tex;
    s.pendingTex = null;
    s.history.push({ ts: Date.now(), type: 'seed', details: { length: (tex || '').length } });
    return s;
  }

  setPending(uid, proposedTex) {
    const s = this.ensure(uid);
    s.pendingTex = proposedTex;
    return s;
  }

  acceptPending(uid) {
    const s = this.ensure(uid);
    if (!s.pendingTex) throw new Error('No pendingTex to accept');
    s.currentTex = s.pendingTex;
    s.pendingTex = null;
    const entry = { ts: Date.now(), type: 'accept' };
    s.history.push(entry);
    return { currentTex: s.currentTex, entry };
  }

  declinePending(uid) {
    const s = this.ensure(uid);
    if (!s.pendingTex) throw new Error('No pendingTex to decline');
    s.pendingTex = null;
    const entry = { ts: Date.now(), type: 'decline' };
    s.history.push(entry);
    return entry;
  }
}

module.exports = new StateStore();
