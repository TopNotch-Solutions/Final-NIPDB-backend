const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  pool: true,
  maxConnections: 2,
  maxMessages: 100,
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;
