const express = require('express');
const { registerUser, loginUser, changePassword }  = require('../controllers/auth-controller');
const authMiddleware = require('../middleware/auth-middleware');

const router = express.Router();

// All routes are related to authentication & authorization:
router.post('/register', registerUser);                                     // /api/auth/register
router.post('/login', loginUser);                                           // /api/auth/login
router.post('/change-password', authMiddleware, changePassword);            // /api/auth/change-password

module.exports = router;