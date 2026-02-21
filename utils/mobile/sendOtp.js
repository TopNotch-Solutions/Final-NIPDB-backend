const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const OTP = require("../../models/otpVerification");
require("dotenv").config();

const sendOTPVerification = async ({ id, email, role }, res, { subject }) => {
  if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Uer ID required fields",
      });
    }

    if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User's email required fields",
      });
    }
    if (!subject) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Email subject required fields",
      });
    }
    if (!role) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Role required fields",
      });
    }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USERNAME,
        pass: process.env.PASSWORD,
      }
    });

    let otp, hashedOTP, mailOptions, expiresAt, resetLink;

    if (role === "User") {
      otp = crypto.randomInt(1000, 10000).toString();
      hashedOTP = await bcrypt.hash(otp, 10); // bcrypt salt rounds

      expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

      mailOptions = {
        from: process.env.USERNAME,
        to: email,
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Verification</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f6f9;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 30px 0; background-color: #f4f6f9;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:8px; padding:40px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <h2 style="margin:0; color:#2c3e50;">Email Verification</h2>
              <p style="margin:5px 0 0 0; font-size:14px; color:#7f8c8d;">
                One-Time Password (OTP) for your account
              </p>
            </td>
          </tr>
          
          <tr>
            <td align="center" style="padding: 20px 0;">
              <p style="font-size:15px; color:#34495e; margin:0;">
                Use the following OTP to verify your email and complete registration:
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 0;">
              <div style="
                display:inline-block;
                padding:15px 30px;
                font-size:26px;
                letter-spacing:5px;
                font-weight:bold;
                color:#ffffff;
                background-color:#2c3e50;
                border-radius:6px;">
                ${otp}
              </div>
            </td>
          </tr>
          
          <tr>
            <td align="center" style="padding-top:10px;">
              <p style="font-size:13px; color:#e74c3c; margin:0;">
                This OTP will expire in 3 minutes.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:30px;">
              <p style="font-size:12px; color:#95a5a6; margin:0;">
                If you did not request this OTP, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
      };
    } else {
      const token = crypto.randomBytes(32).toString('hex');
      resetLink = `http://41.219.71.112:8080/reset-password?token=${token}&userId=${id}`;
      hashedOTP = await bcrypt.hash(token, 10);

      expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      mailOptions = {
        from: process.env.USERNAME,
        to: email,
        subject,
       html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f6f9;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 30px 0; background-color: #f4f6f9;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:8px; padding:40px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <h2 style="margin:0; color:#2c3e50;">Reset Your Password</h2>
              <p style="margin:5px 0 0 0; font-size:14px; color:#7f8c8d;">
                Secure link to update your password
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 0;">
              <p style="font-size:15px; color:#34495e; margin:0;">
                Click the button below to reset your password. The link will expire in 1 hour.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 20px 0;">
              <a href="${resetLink}" style="
                display:inline-block;
                padding:15px 30px;
                font-size:16px;
                font-weight:bold;
                color:#ffffff;
                background-color:#e74c3c;
                text-decoration:none;
                border-radius:6px;">
                Reset Password
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:10px;">
              <p style="font-size:13px; color:#e74c3c; margin:0;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:30px;">
              <p style="font-size:12px; color:#95a5a6; margin:0;">
                If you did not request this password reset, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
      };
    }
    await OTP.destroy({
      where: { userId: id, role }
    });

    await OTP.create({
      userId: id,
      otp: hashedOTP,
      role,
      createdAt: new Date(),
      expiresAt
    });

    await transporter.sendMail(mailOptions);

    // 🔹 Prepare professional API response
    const message = subject === "In4MSME Account Verification"
      ? `Verification OTP sent to ${email}.`
      : `Email sent to ${email}.`;

    const response = {
      success: true,
      statusCode: 200,
      message,
      userId: id
    };

    if (subject === "In4MSME Account Verification") {
      response.data.verify = true;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error("OTP Service Error:", {
      message: error.message,
      stack: error.stack
    });

    return res.status(503).json({
      status: "FAILURE",
      message: "Service temporarily unavailable. Please try again later.",
    });
  }
};

module.exports = sendOTPVerification;