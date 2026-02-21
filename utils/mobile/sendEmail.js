const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async ({ email, subject, notification }, res) => {

  if (!notification) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Notification required fields",
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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USERNAME,
        pass: process.env.PASSWORD,
      }
    });

    const templates = {
      pending: `
        <h2 style="color:#2c3e50;">Application Under Review</h2>
        <p>Dear Entrepreneur,</p>
        <p>Thank you for applying to the in4msme app. We will review your application for accuracy and legitimacy before approving it. This process may take up to 10 business days. You will be notified of the status of your application once the review is complete.</p>
        <p>Kind regards,<br/>NIPDB</p>
      `,
      approved: `
        <h2 style="color:#27ae60;">Application Approved!</h2>
        <p>Dear Entrepreneur,</p>
        <p>We are pleased to inform you that your account has been approved! Your business profile is now publicly visible to potential customers, investors, and business support organisations.</p>
        <p>If you wish to hide your profile, you can do so in your account settings.</p>
        <p>Questions? Contact us at <a href="mailto:msme.eo@nipdb.com">msme.eo@nipdb.com</a>.</p>
        <p>Kind regards,<br/>NIPDB</p>
      `,
      rejected: `
        <h2 style="color:#e74c3c;">Application Rejected</h2>
        <p>Dear Entrepreneur,</p>
        <p>We regret to inform you that your application to the in4msme app was unsuccessful. Possible reasons may include:</p>
        <ul>
          <li>False or incorrect information</li>
          <li>Inconsistencies in the provided information</li>
          <li>Non-compliance with the criteria</li>
          <li>Violations of terms or policies</li>
        </ul>
        <p>Please review the feedback and feel free to reapply. Questions? Contact <a href="mailto:msme.eo@nipdb.com">msme.eo@nipdb.com</a> or call 083 333 8619.</p>
        <p>Kind regards,<br/>NIPDB</p>
      `,
      blocked: `
        <h2 style="color:#e67e22;">Business Blocked</h2>
        <p>Dear Entrepreneur,</p>
        <p>Your business has been blocked due to a violation of our terms or policies. While blocked, your business will not be visible to other users.</p>
        <p>For assistance, contact <a href="mailto:support@nipdb.com">support@nipdb.com</a>.</p>
        <p>Kind regards,<br/>NIPDB</p>
      `,
      unblocked: `
        <h2 style="color:#27ae60;">Business Unblocked</h2>
        <p>Dear Entrepreneur,</p>
        <p>Good news! Your business has been unblocked and is now visible to other users on the platform.</p>
        <p>Questions? Contact <a href="mailto:support@nipdb.com">support@nipdb.com</a>.</p>
        <p>Kind regards,<br/>NIPDB</p>
      `
    };

    if (!templates[notification]) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "The specified notification type is not recognized."
      });
    }

    const mailOptions = {
      from: process.env.USERNAME,
      to: email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; padding:30px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                  <tr>
                    <td>${templates[notification]}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Email (${notification}) sent successfully to ${email}.`,
      meta: { timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error("Email Service Error:", {
      message: error.message,
      stack: error.stack
    });

    return res.status(503).json({
      status: "FAILURE",
      message: "Service temporarily unavailable. Please try again later.",
    });
  }
};

module.exports = sendEmail;