const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "..", "..", "requests.log");

const SENSITIVE_KEYS = [
  "password",
  "currentpassword",
  "newpassword",
  "confirmpassword",
  "otp",
  "token",
  "authorization",
  "web_token",
  "mobile_token",
  "refreshtoken",
];

function sanitize(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value !== "object") return value;

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      out[key] = "[REDACTED]";
    } else {
      out[key] = sanitize(val);
    }
  }
  return out;
}

function hasAuthHeader(req) {
  return Boolean(
    req.get("authorization") ||
      req.get("x-access-token") ||
      req.get("data-access-token")
  );
}

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const entry = {
      timestamp: new Date().toISOString(),
      durationMs,
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage || undefined,
      ip: {
        client: req.ip || req.socket?.remoteAddress || "-",
        remoteAddress: req.socket?.remoteAddress || "-",
        xForwardedFor: req.get("x-forwarded-for") || null,
        xRealIp: req.get("x-real-ip") || null,
        xForwardedHost: req.get("x-forwarded-host") || null,
        xForwardedProto: req.get("x-forwarded-proto") || null,
      },
      httpVersion: req.httpVersion,
      host: req.get("host") || null,
      origin: req.get("origin") || null,
      referer: req.get("referer") || req.get("referrer") || null,
      contentType: req.get("content-type") || null,
      contentLength: req.get("content-length") || null,
      accept: req.get("accept") || null,
      userAgent: req.get("user-agent") || null,
      authenticated: hasAuthHeader(req),
      params: {
        query: sanitize(req.query || {}),
        route: sanitize(req.params || {}),
        body: sanitize(req.body || {}),
      },
      response: {
        contentType: res.getHeader("content-type") || null,
        contentLength: res.getHeader("content-length") || null,
      },
    };

    fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n", (err) => {
      if (err) {
        console.error("Failed to write request log:", err.message);
      }
    });
  });

  next();
}

module.exports = requestLogger;
