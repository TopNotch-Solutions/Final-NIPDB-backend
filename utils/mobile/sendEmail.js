const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, notification }, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.gmail.com',
      port: 25,
      tls: {
        rejectUnauthorized: false,
      },
    });

    let mailOptions;
    if (notification === "pending") {
      mailOptions = {
        from: 'in4msme@nipdb.com',
        to: email,
        subject: subject,
        html: `<p>Dear Entrepreneur,<br><br>Thank you for applying to the in4msme app. We will review your application for accuracy and legitimacy before approving it. This process may take up to 10 business days. You will be notified of the status of your application once the review is complete.<br><br>Kind regards,<br>NIPDB</p>`,
      };
    } else if (notification === "approved") {
      mailOptions = {
        from: 'in4msme@nipdb.com',
        to: email,
        subject: subject,
        html: `<p>Dear Entrepreneur,<br><br>We are pleased to inform you that your account has been approved! You can access your account, and your business’ profile is now publicly visible to potential customers, investors, and business support organisations. You can choose to hide your profile in your account settings, which means only NIPDB can see your profile.<br><br>If you have any questions, please do not hesitate to contact us at <a href="mailto:msme.eo@nipdb.com">msme.eo@nipdb.com</a>.<br><br>Kind Regards,<br>NIPDB</p>`,
      };
    } else if (notification === "rejected") {
      mailOptions = {
        from: 'in4msme@nipdb.com',
        to: email,
        subject: subject,
        html: `<p>Dear Entrepreneur,<br><br>We regret to inform you that your application to the in4msme app was unsuccessful. Possible reasons for this decision may include:<br><ul><li>False or incorrect information</li><li>Inconsistencies in the provided information</li><li>Non-compliance with the criteria</li><li>Violations of the terms or policies</li></ul><br>Please review the feedback provided and feel free to reapply. If you have any questions regarding your application, do not hesitate to contact us at <a href="mailto:msme.eo@nipdb.com">msme.eo@nipdb.com</a> or call 083 333 8619.<br><br>Kind Regards,<br>NIPDB</p>`,
      };
    } else if (notification === "blocked") {
      mailOptions = {
        from: 'in4msme@nipdb.com',
        to: email,
        subject: subject,
        html: `<p>Dear Entrepreneur,<br><br>We regret to inform you that your business has been blocked due to a violation of our terms or policies. While blocked, your business will not be visible to other users on the platform. Please contact us at <a href="mailto:support@nipdb.com">support@nipdb.com</a> if you have any questions or wish to resolve the issue.<br><br>Kind Regards,<br>NIPDB</p>`,
      };
    } else if (notification === "unblocked") {
      mailOptions = {
        from: 'in4msme@nipdb.com',
        to: email,
        subject: subject,
        html: `<p>Dear Entrepreneur,<br><br>Good news! Your business has been unblocked and is now visible to other users on the platform. Thank you for your cooperation. If you have any further questions, feel free to reach out to us at <a href="mailto:support@nipdb.com">support@nipdb.com</a>.<br><br>Kind Regards,<br>NIPDB</p>`,
      };
    }

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        if (!res.headersSent) {
          return res.status(500).json({
            status: "FAILURE",
            message: "Internal server error: " + error.message,
          });
        }
      } else {
        if (!res.headersSent) {
          return res.status(201).json({
            status: "SUCCESS",
            message: `Email sent to ${email}.`,
          });
        }
      }
    });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({
        status: "FAILURE",
        message: "Internal Server Error: " + error.message,
      });
    }
  }
};

module.exports = sendEmail;
