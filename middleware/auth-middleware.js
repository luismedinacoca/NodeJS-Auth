const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('🗣️ Auth middleware is called');
  const authHeader = req.headers["authorization"];
  console.log("🔑 Auth header is: ", authHeader);

  const token = authHeader && authHeader.split(" ")[1];
  console.log("🔐 Token is: ", token);

  if(!token){
    return res.status(401).json({
      success: false,
      message: `Access  denied. No Token provided. Please login to continue!`
    })
  }

  // decode this token
  try {
    const decodedTokenInfo = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("Decoded token info is: ", decodedTokenInfo);
    req.userInfo = decodedTokenInfo;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: `Access  denied. No Token provided. Please login to continue!`
    })
  }
}

module.exports = authMiddleware;      