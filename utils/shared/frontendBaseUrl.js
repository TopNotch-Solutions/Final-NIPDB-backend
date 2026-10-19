require("dotenv").config();

/**
 * Absolute frontend origin for emailed links (resets, onboarding).
 * Prefer FRONTEND_BASE_URL; fall back by ENVIRONMENT so Host headers are never used.
 */
function getFrontendBaseUrl() {
  if (process.env.FRONTEND_BASE_URL) {
    return process.env.FRONTEND_BASE_URL.replace(/\/$/, "");
  }

  const env = (process.env.ENVIRONMENT || "").toLowerCase();
  if (env === "prod" || env === "production") {
    return "https://in4msmeportal.nipdb.com";
  }
  if (env === "uat") {
    return "http://41.219.71.112:8080";
  }
  return "http://localhost:3000";
}

module.exports = getFrontendBaseUrl;
