const express = require('express');
const authMiddleware = require('../middleware/auth-middleware');
const router = express.Router();

//router.get('/welcome', handler01, handler02, handler03,(req, res) => { // 👉🏽 next section
router.get('/welcome', authMiddleware,(req, res) => {
  const {userId, username, role} = req.userInfo;
  res.json({
    message: `🎉 Welcome to the home page ${username} 👍🏽`,
    user: {
      _id: userId,
      username,
      role,
    }
  })
})
// localhost:3000/api/home/welcome
module.exports = router;