const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports.createWebRefreshToken = (id, role) => {
    return jwt.sign(
      { id, role },
      process.env.WEB_REFRESH_TOKEN,
      {
        expiresIn: "30m",
      }
    );
  };