const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const OTP = require("../../models/otpVerification");
const { where } = require("sequelize");

const sendAdminOTPVerification = async ({ id, email }, res, { subject }) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const salt = await bcrypt.genSalt();
    const hashedOTP = await bcrypt.hash(otp, salt);

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.gmail.com',
      port: 25,
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: 'in4msme@nipdb.com',
      to: email,
      subject: subject,
      html: `<p>Enter <b>${otp}</b> in the portal to verify your email address and complete your login. <b>OTP will expire in 3 minutes.</b></p>`,
    };

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Invalid user ID",
      });
    }
    await OTP.destroy({
      where:{
        userId: id
      }
    });

    await OTP.create({
      userId: id,
      otp: hashedOTP,
      role: "Admin",
      createdAt: Date.now(),
      expiresAt: Date.now() + 180000, 
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email error: ", error);
        return res.status(500).json({
          status: "FAILURE",
          message: "Internal server error: " + error.message,
        });
      } else {
        console.log("Email sent: ", info.response);
        return res.status(200).json({
          status: "SUCCESS",
          message: "Email has been sent",
          isAuthenticated: true,
          userId: id
        });
      }
    });

  } catch (error) {
    console.error("OTP Error: ", error);
    if (!res.headersSent) {
      res.status(500).json({
        status: "FAILURE",
        message: "Internal Server Error: " + error.message,
      });
    }
  }
};

module.exports = sendAdminOTPVerification;
