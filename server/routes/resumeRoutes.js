// FILE: server/routes/resumeRoutes.js
const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

// GET /api/resume/template/:id
router.get('/template/:id', resumeController.getTemplate);

// POST /api/resume/accept
router.post('/accept', resumeController.accept);

// POST /api/resume/decline
router.post('/decline', resumeController.decline);

module.exports = router;
