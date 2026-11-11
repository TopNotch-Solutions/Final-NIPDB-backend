const jwt = require('jsonwebtoken');
require('dotenv').config();
const sendErrorAlert = require('../../utils/shared/sendErrorAlert.js');
const User = require('../../models/user');

const rejectIfUserInactive = async (decoded, res) => {
  if (!decoded?.id || decoded.role !== 'User') {
    return false;
  }

  const user = await User.findOne({
    where: { id: decoded.id },
    attributes: ['id', 'isDeleted', 'isDeactivated'],
  });

  if (!user) {
    res.status(401).json({
      status: "FAILURE",
      message: "Access denied. User not found.",
    });
    return true;
  }

  if (user.isDeleted) {
    res.status(403).json({
      status: "FAILURE",
      message: "This account is deleted. Verify OTP to restore it within the recovery window.",
      recoverable: true,
    });
    return true;
  }

  if (user.isDeactivated) {
    res.status(403).json({
      status: "FAILURE",
      message: "This account is deactivated.",
      deactivated: true,
    });
    return true;
  }

  return false;
};

module.exports.tokenAuthMiddleware = async (req, res, next) => {
  const authHeader = req.header('x-access-token');
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
    const secretKey = process.env.MOBILE_TOKEN;
    const decoded = jwt.verify(token, secretKey);
    if (await rejectIfUserInactive(decoded, res)) {
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (!(err instanceof jwt.TokenExpiredError)) {
      sendErrorAlert(err, { source: "middlewares/mobile/authMiddleware.js" });
    }
    res.status(400).json({
      status: "FAILURE",
      message: "Invalid token.",
    });
  }
};

module.exports.appTokenMiddleware = (req, res, next) => {
  const authHeader = req.header('data-access-token');
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
    const secretKey = process.env.MOBILE_TOKEN;
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (err) {
    if (!(err instanceof jwt.TokenExpiredError)) {
      sendErrorAlert(err, { source: "middlewares/mobile/authMiddleware.js" });
    }
    res.status(400).json({
      status: "FAILURE",
      message: "Invalid token.",
    });
  }
};


module.exports.checkUser = async (req, res, next) => {
  const authHeader = req.header('x-access-token');
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
    const secretKey = process.env.MOBILE_TOKEN;
    const decoded = jwt.verify(token, secretKey); 
    if (decoded.role !== 'User') {
      return res.status(403).json({
        status: "FAILURE",
        message: "Access denied. User does not have access to this route.",
      });
    }

    if (await rejectIfUserInactive(decoded, res)) {
      return;
    }

    req.user = decoded; 

    next();
  } catch (err) {
    if (!(err instanceof jwt.TokenExpiredError)) {
      sendErrorAlert(err, { source: "middlewares/mobile/authMiddleware.js" });
    }
    return res.status(401).json({
      status: "FAILURE",
      message: "Invalid token.",
    });
  }
};

module.exports.checkAppUser = (req, res, next) => {
  const authHeader = req.header('data-access-token');
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
    const secretKey = process.env.MOBILE_TOKEN;
    const decoded = jwt.verify(token, secretKey); 
    if (decoded.role !== 'app-user') {
      return res.status(403).json({
        status: "FAILURE",
        message: "Access denied. User does not have access to this route.",
      });
    }
    console.log(req.user)

    req.user = decoded; 

    next();
  } catch (err) {
    if (!(err instanceof jwt.TokenExpiredError)) {
      sendErrorAlert(err, { source: "middlewares/mobile/authMiddleware.js" });
    }
    return res.status(401).json({
      status: "FAILURE",
      message: "Invalid token.",
    });
  }
};