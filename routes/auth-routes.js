const express = require('express');
const { registerUser, loginUser }  = require('../controllers/auth-controller');

const router = express.Router();

// All routes are related to authentication & authorization:
router.post('/register', registerUser);     // /api/auth/register
router.post('/login', loginUser);           // /api/auth/login

module.exports = router;