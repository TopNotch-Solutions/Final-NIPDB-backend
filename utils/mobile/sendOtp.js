const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const OTP = require("../../models/otpVerification");


sendOTPVerification = async ({ id, email, role }, res, { subject }) => {
  try {
    let mailOptions, otp, hashedOTP, resetLink;

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.gmail.com',
      port: 25,
      tls: {
        rejectUnauthorized: false,
      },
    });

    if (role === "User") {
      otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      const salt = await bcrypt.genSalt();
      hashedOTP = await bcrypt.hash(otp, salt);

      mailOptions = {
        from: 'in4msme@nipdb.com',
        to: email,
        subject: subject,
        html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete your registration. <b>OTP will expire in 3 minutes.</b></p>`,
      };

      await OTP.destroy({
        where: {
          userId: id,
        },
      });

      await OTP.create({
        userId: id,
        otp: hashedOTP,
        role,
        createdAt: Date.now(),
        expiresAt: Date.now() + 180000,
      });
    } else {
      const token = crypto.randomBytes(32).toString('hex');
      resetLink = `https://dt.mtc.com.na/reset-password?token=${token}&userId=${id}`;
      const salt = await bcrypt.genSalt();
      hashedOTP = await bcrypt.hash(token, salt);

      mailOptions = {
        from: 'in4msme@nipdb.com',
        to: email,
        subject: subject,
        html: `<p>Click the link below to reset your password. The link will expire in 1 hour.</p><p><a href="${resetLink}">Reset Password</a></p>`,
      };

      await OTP.destroy({
        where: {
          userId: id,
        },
      });

      await OTP.create({
        userId: id,
        otp: hashedOTP,
        role,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      });
    }

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Mail send error:", error);
        return res.status(500).json({
          status: "FAILURE",
          message: "Internal server error: " + error.message,
        });
      }

      const message =
        subject === "In4MSME Account Verification"
          ? `Verification OTP sent to ${email}.`
          : `Email sent to ${email}.`;

          const response = {
            status: subject === "In4MSME Account Verification" ? "SUCCESS" : "PENDING",
            message,
            userId: id,
          };
          
          if (subject === "In4MSME Account Verification") {
            response.verify = true;
          }
          
          return res.status(200).json(response);
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error: " + error.message,
    });
  }
}

module.exports = sendOTPVerification;
