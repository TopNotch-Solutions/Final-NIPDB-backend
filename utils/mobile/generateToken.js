const jwt = require("jsonwebtoken");
require('dotenv').config();

const createMobileToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.MOBILE_TOKEN,
    {
      expiresIn: 3155760000,
    }
  );
};

const createAppUserToken = () => {
  const role = "app-user";
  return jwt.sign(
    { role },
    process.env.MOBILE_TOKEN,
    {
      expiresIn: 3155760000, 
    }
  );
};

module.exports = {
  createMobileToken,
  createAppUserToken,
}