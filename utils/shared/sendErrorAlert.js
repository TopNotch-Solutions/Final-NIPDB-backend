const transporter = require("./mailTransporter");
require("dotenv").config();

const ERROR_RECIPIENTS = [
  "PWilhelm@mtc.com.na",
  "TKandjimwena@mtc.com.na",
  "RFangda@mtc.com.na"
];

const isTokenExpiredError = (error) => {
  if (!error) return false;
  if (error.name === "TokenExpiredError") return true;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : error.message || "";

  return (
    typeof message === "string" &&
    (message.includes("jwt expired") || message.includes("TokenExpiredError"))
  );
};

/**
 * Fire-and-forget SMTP alert for caught errors.
 * Never throws — failures are logged only to avoid nested catch loops.
 */
const sendErrorAlert = (error, context = {}) => {
  try {
    if (isTokenExpiredError(error)) {
      return;
    }

    const environment = process.env.ENVIRONMENT || "unknown";
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const source = context.source || "unknown";
    const extra = context.extra ? String(context.extra) : "";

    transporter
      .sendMail({
        from: "in4msme@nipdb.com",
        to: ERROR_RECIPIENTS.join(", "),
        subject: `[${environment.toUpperCase()}] NIPDB API Error — ${source}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Error Alert</title>
</head> 
<body style="margin:0; padding:0; background-color:#0f1419; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f1419; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px; background-color:#171c23; border:1px solid #2a323c; border-radius:16px; overflow:hidden;">
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #ef4444 0%, #f97316 100%); font-size:0; line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block; padding:6px 12px; background-color:#3f1515; color:#fca5a5; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; border-radius:999px; border:1px solid #7f1d1d;">
                      Critical · ${String(environment).toUpperCase()}
                    </span>
                  </td>
                  <td align="right" style="color:#6b7280; font-size:12px; white-space:nowrap;">
                    NIPDB API
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 24px 28px;">
              <h1 style="margin:0 0 8px 0; color:#f9fafb; font-size:24px; font-weight:700; letter-spacing:-0.02em; line-height:1.25;">
                Unhandled API Error
              </h1>
              <p style="margin:0; color:#9ca3af; font-size:14px; line-height:1.5;">
                An exception was caught and needs attention.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f1419; border:1px solid #2a323c; border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px; border-bottom:1px solid #2a323c; width:50%; vertical-align:top;">
                    <div style="color:#6b7280; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px;">Environment</div>
                    <div style="color:#f3f4f6; font-size:14px; font-weight:600;">${environment}</div>
                  </td>
                  <td style="padding:16px 18px; border-bottom:1px solid #2a323c; width:50%; vertical-align:top;">
                    <div style="color:#6b7280; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px;">Timestamp</div>
                    <div style="color:#f3f4f6; font-size:14px; font-weight:600;">${new Date().toISOString()}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:16px 18px; ${extra ? "border-bottom:1px solid #2a323c;" : ""}">
                    <div style="color:#6b7280; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px;">Source</div>
                    <div style="color:#93c5fd; font-size:13px; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; word-break:break-all;">${source}</div>
                  </td>
                </tr>
                ${
                  extra
                    ? `<tr>
                  <td colspan="2" style="padding:16px 18px;">
                    <div style="color:#6b7280; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px;">Context</div>
                    <div style="color:#f3f4f6; font-size:14px;">${extra}</div>
                  </td>
                </tr>`
                    : ""
                }
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <div style="color:#6b7280; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; margin:0 0 10px 0;">Error Message</div>
              <div style="background-color:#1a0f0f; border:1px solid #7f1d1d; border-left:4px solid #ef4444; border-radius:10px; padding:16px 18px;">
                <pre style="margin:0; color:#fecaca; font-size:13px; line-height:1.55; white-space:pre-wrap; word-break:break-word; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${message}</pre>
              </div>
            </td>
          </tr>
          ${
            stack
              ? `<tr>
            <td style="padding:0 28px 28px 28px;">
              <div style="color:#6b7280; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; margin:0 0 10px 0;">Stack Trace</div>
              <div style="background-color:#0f1419; border:1px solid #2a323c; border-radius:10px; padding:16px 18px; max-height:320px; overflow:auto;">
                <pre style="margin:0; color:#9ca3af; font-size:11px; line-height:1.6; white-space:pre-wrap; word-break:break-word; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${stack}</pre>
              </div>
            </td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding:18px 28px; background-color:#12171e; border-top:1px solid #2a323c;">
              <p style="margin:0; color:#6b7280; font-size:12px; line-height:1.5;">
                Automated alert from the NIPDB backend · Do not reply to this email
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      })
      .catch((mailError) => {
        console.error("Failed to send error alert email:", mailError.message);
      });
  } catch (mailError) {
    console.error("Failed to send error alert email:", mailError.message);
  }
};

module.exports = sendErrorAlert;
