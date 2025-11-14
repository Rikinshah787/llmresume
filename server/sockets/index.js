// FILE: server/sockets/index.js
const { Server } = require('socket.io');
const cookie = require('cookie');
const { v4: uuidv4 } = require('uuid');
const userLogger = require('../services/userLogger');

/**
 * Socket manager wrapper
 * - Attaches to an HTTP server and sets up handlers
 * - Emits to rooms keyed by uid
 */
function initSockets(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: app.get('config').corsOrigin,
      methods: ['GET', 'POST']
    }
  });

  function emitToUid(uid, event, payload) {
    if (!uid) return;
    io.to(uid).emit(event, payload);
  }

  io.on('connection', (socket) => {
    try {
      const raw = socket.handshake.headers?.cookie || '';
      const cookies = cookie.parse(raw || '');
      let uid = cookies.uid;
      if (!uid) {
        uid = socket.handshake.query?.uid || null;
      }

      if (!uid) {
        uid = uuidv4();
        socket.emit('uid:assign', { uid });
      }

      socket.join(uid);

  // Track active socket connections per uid and persist simple logs
  try { userLogger.incrementActive(uid); } catch (err) { console.error('userLogger.incrementActive error:', err?.message || err); }

      socket.on('chat:userMessage', async (payload) => {
        const message = payload?.message;
        if (!message) return;
        const groClient = require('../services/groClient');
        const stateStore = require('../services/stateStore');
        const { validateTex } = require('../services/latexValidator');

        const state = stateStore.ensure(uid);
        const currentTex = state.currentTex || '';

        try {
          const { proposedTex, explanation } = await groClient.proposeUpdate(message, currentTex);
          const validation = validateTex(proposedTex);
          stateStore.setPending(uid, proposedTex);
          emitToUid(uid, 'resume:updatePreview', {
            proposedTex,
            explanation: explanation || '',
            valid: validation.valid,
            errors: validation.errors || []
          });
        } catch (err) {
          emitToUid(uid, 'resume:updatePreview', {
            proposedTex: null,
            explanation: `Error from Gro: ${err.message}`,
            valid: false,
            errors: [err.message]
          });
        }
      });

      socket.on('resume:accept', async () => {
        const resumeService = require('../services/resumeService');
        try {
          const result = resumeService.acceptPending(uid);
          emitToUid(uid, 'resume:updatePreview', { proposedTex: null, explanation: 'Committed', valid: true, committed: true });
          emitToUid(uid, 'resume:committed', { currentTex: result.currentTex });
        } catch (err) {
          emitToUid(uid, 'resume:updatePreview', { proposedTex: null, explanation: err.message, valid: false, errors: err.errors || [err.message] });
        }
      });

      socket.on('resume:decline', async () => {
        const resumeService = require('../services/resumeService');
        try {
          resumeService.declinePending(uid);
          emitToUid(uid, 'resume:updatePreview', { proposedTex: null, explanation: 'Declined', valid: true, committed: false });
        } catch (err) {
          emitToUid(uid, 'resume:updatePreview', { proposedTex: null, explanation: err.message, valid: false, errors: [err.message] });
        }
      });

      socket.on('disconnect', () => {
        socket.leave(uid);
        try { userLogger.decrementActive(uid); } catch (err) { console.error('userLogger.decrementActive error:', err?.message || err); }
      });
    } catch (err) {
      console.error('Socket connection error:', err?.message || err);
    }
  });

  app.set('sockets', { io, emitToUid });
  return { io, emitToUid };
}

module.exports = initSockets;
