// FILE: server/controllers/resumeController.js
const templateService = require('../services/templateService');
const resumeService = require('../services/resumeService');

/**
 * Controller: GET /api/resume/template/:id
 * Loads a template and seeds user's currentTex
 */
async function getTemplate(req, res, next) {
  try {
    const uid = req.uid;
    const id = req.params.id;
    const tex = await templateService.loadTemplate(id);
    const result = resumeService.seedTemplateForUser(uid, tex);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/resume/accept
 */
async function accept(req, res, next) {
  try {
    const uid = req.uid;
    const result = resumeService.acceptPending(uid);
    req.app.get('sockets')?.emitToUid(uid, 'resume:updatePreview', {
      proposedTex: null,
      explanation: 'Committed',
      valid: true,
      committed: true
    });
    return res.json({ currentTex: result.currentTex });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/resume/decline
 */
async function decline(req, res, next) {
  try {
    const uid = req.uid;
    const result = resumeService.declinePending(uid);
    req.app.get('sockets')?.emitToUid(uid, 'resume:updatePreview', {
      proposedTex: null,
      explanation: 'Declined',
      valid: true,
      committed: false
    });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTemplate, accept, decline };
