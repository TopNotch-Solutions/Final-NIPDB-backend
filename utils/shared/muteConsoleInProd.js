/**
 * Silence all console.log / info / debug calls project-wide
 * when ENVIRONMENT is prod or production.
 * console.error and console.warn stay enabled for ops.
 */
function muteConsoleInProd() {
  const env = (process.env.ENVIRONMENT || "").toLowerCase();
  if (env === "prod" || env === "production") {
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.debug = noop;
  }
}

module.exports = muteConsoleInProd;
