const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports.createWebToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.WEB_TOKEN,
    {
      expiresIn: "30m",
    }
  );
};

