const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const OTP = require("../../models/otpVerification");
require("dotenv").config();

const generateOTP = () => {
  return crypto.randomInt(1000, 10000).toString();
};

const sendAdminOTPVerification = async ({ id, email }, res, { subject }) => {

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

  try {
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USERNAME,
        pass: process.env.PASSWORD,
      },
    });

    await OTP.destroy({
      where: { userId: id},
    });

    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    await OTP.create({
      userId: id,
      otp: hashedOTP,
      role: "Admin",
      createdAt: new Date(),
      expiresAt,
    });

    await transporter.sendMail({
      from: process.env.USERNAME,
      to: email,
      subject,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>OTP Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f9; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9; padding:30px 0;">
    <tr>
      <td align="center">
        
        <table width="500" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:8px; padding:40px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="margin:0; color:#009548;">Email Verification</h2>
              <p style="margin:5px 0 0 0; color:#7f8c8d; font-size:14px;">
                Secure One-Time Password (OTP)
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 0;">
              <p style="font-size:15px; color:#34495e; margin:0;">
                Please use the following One-Time Password to verify your email address 
                and complete your login process:
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 0;">
              <div style="
                display:inline-block;
                padding:15px 30px;
                font-size:26px;
                letter-spacing:5px;
                font-weight:bold;
                color:#ffffff;
                background-color:#009548;
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
                If you did not request this code, please ignore this email.
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
    });

    return res.status(200).json({
      status: "SUCCESS",
       message: "A One-Time Password (OTP) has been successfully sent to the registered email address.",
      isAuthenticated: true,
      userId: id,
    });

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

module.exports = sendAdminOTPVerification;