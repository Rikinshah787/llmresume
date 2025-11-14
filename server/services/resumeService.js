// FILE: server/services/resumeService.js
const stateStore = require('./stateStore');
const { validateTex } = require('./latexValidator');

function seedTemplateForUser(uid, tex) {
  const state = stateStore.seedCurrent(uid, tex);
  return { currentTex: state.currentTex };
}

function createPendingFromProposed(uid, proposedTex) {
  const validation = validateTex(proposedTex);
  stateStore.setPending(uid, proposedTex);
  return { proposedTex, valid: validation.valid, errors: validation.errors };
}

function acceptPending(uid) {
  const s = stateStore.get(uid);
  if (!s || !s.pendingTex) {
    const err = new Error('No pending proposal to accept');
    err.status = 400;
    throw err;
  }
  const validation = validateTex(s.pendingTex);
  if (!validation.valid) {
    const err = new Error('Pending LaTeX failed validation');
    err.status = 400;
    err.errors = validation.errors;
    throw err;
  }
  const result = stateStore.acceptPending(uid);
  return { currentTex: result.currentTex, historyEntry: result.entry };
}

function declinePending(uid) {
  const s = stateStore.get(uid);
  if (!s || !s.pendingTex) {
    const err = new Error('No pending proposal to decline');
    err.status = 400;
    throw err;
  }
  const entry = stateStore.declinePending(uid);
  return { ok: true, historyEntry: entry };
}

module.exports = { seedTemplateForUser, createPendingFromProposed, acceptPending, declinePending };
