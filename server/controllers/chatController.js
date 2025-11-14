// FILE: server/controllers/chatController.js
const groClient = require('../services/groClient');
const { validateTex } = require('../services/latexValidator');
const stateStore = require('../services/stateStore');

/**
 * POST /api/chat/send
 * Body: { message }
 *
 * Calls Gro API, validates proposedTeX, stores pendingTex, emits socket message.
 */
async function sendMessage(req, res, next) {
  try {
    const uid = req.uid;
    const body = req.body || {};
    const message = String(body.message || '').trim();
    if (!message) return res.status(400).json({ error: 'message required' });

    const state = stateStore.ensure(uid);
    const currentTex = state.currentTex || '';

    const { proposedTex, explanation } = await groClient.proposeUpdate(message, currentTex);

    const validation = validateTex(proposedTex);
    stateStore.setPending(uid, proposedTex);

    const sockets = req.app.get('sockets');
    const payload = {
      proposedTex,
      explanation: explanation || '',
      valid: validation.valid,
      errors: validation.errors || []
    };
    sockets?.emitToUid(uid, 'resume:updatePreview', payload);

    return res.json(payload);
  } catch (err) {
    next(err);
  }
}

module.exports = { sendMessage };
