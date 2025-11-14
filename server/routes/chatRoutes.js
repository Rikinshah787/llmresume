// FILE: server/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// POST /api/chat/send
router.post('/send', chatController.sendMessage);

module.exports = router;
