const jwt = require('jsonwebtoken');
require('dotenv').config();
const { createWebToken } = require('../../utils/web/generateToken');

module.exports.tokenAuthMiddleware = (req, res, next) => {
  const authHeader = req.header('x-access-token');
  console.log("Here is the token before updating: ",authHeader)
  if (!authHeader) {
    return res.status(401).json({
      status: "FAILURE",
      message: "Access denied. No Authorization header provided.",
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      status: "FAILURE",
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.WEB_TOKEN);
    req.user = decoded;

    const newToken = createWebToken(decoded.id, decoded.role);

    res.setHeader('x-access-token', `Bearer ${newToken}`);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      
      res.setHeader('x-access-token', '');
      req.user = null;
      console.log(req.user,"Token has expired")
      return res.status(401).json({
        status: "FAILURE",
        message: "Token has expired. Please log in again.",
      });
    } else {
      req.user = null;
      console.log(req.user,"Invalid token")
      return res.status(400).json({
        status: "FAILURE",
        message: "Invalid token.",
      })
    }
  }
};

module.exports.checkAdmin = (req, res, next) => {
  console.log("Current user: ", req.user)
  if (!req.user) {
    return res.status(401).json({
      status: "FAILURE",
      message: "Access denied. No token provided.",
    });
  }

  try {
    if (req.user.role !== "Super admin" && req.user.role !== "Admin") {
      return res.status(403).json({
        status: "FAILURE",
        message: "Access denied. User does not have access to this route.",
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({
      status: "FAILURE",
      message: "Invalid token.",
    });
  }
};
