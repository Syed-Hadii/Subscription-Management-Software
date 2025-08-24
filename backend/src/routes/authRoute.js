const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');

// Verify token endpoint
router.get('/verify', authMiddleware, (req, res) => {
    res.json({ valid: true });
});

module.exports = router;
