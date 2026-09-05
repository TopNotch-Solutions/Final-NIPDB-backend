const FcmToken = require("../../models/fcmToken");
const DeviceToken = require("../../models/deviceToken");

const UNREGISTERED_FCM_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "registration-token-not-registered",
  "invalid-registration-token",
  "UNREGISTERED",
  "NOT_FOUND",
  "NotRegistered",
  "InvalidRegistration",
]);

/**
 * Checks if a Firebase error indicates that the registration token
 * is invalid, unregistered, or expired.
 */
const isInvalidFcmTokenError = (error) => {
  if (!error) return false;

  const code = (error.code || error.errorInfo?.code || "").toLowerCase();
  for (const c of UNREGISTERED_FCM_ERROR_CODES) {
    if (code === c.toLowerCase() || code.includes(c.toLowerCase())) {
      return true;
    }
  }

  const message = (
    (error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : error?.message || error?.errorInfo?.message) || ""
  ).toLowerCase();

  if (
    message.includes("notregistered") ||
    message.includes("not registered") ||
    message.includes("registration-token-not-registered") ||
    message.includes("invalid-registration-token") ||
    message.includes("not a valid fcm registration token") ||
    message.includes("requested entity was not found") ||
    message.includes("invalid registration token") ||
    message.includes("unregistered")
  ) {
    return true;
  }

  return false;
};

const isUsableFcmToken = (deviceToken) => {
  if (typeof deviceToken !== "string") return false;
  return deviceToken.trim().length >= 50;
};

/**
 * Remove an invalid/unregistered token from both FcmToken and DeviceToken tables.
 */
const removeInvalidFcmToken = async (deviceToken, firebaseError) => {
  if (!deviceToken) return false;
  if (firebaseError && !isInvalidFcmTokenError(firebaseError)) {
    return false;
  }

  try {
    await Promise.allSettled([
      FcmToken.destroy({ where: { deviceToken } }),
      DeviceToken.destroy({ where: { deviceToken } }),
    ]);
    console.log(`[FCM] Successfully removed unregistered/invalid token: ${deviceToken}`);
    return true;
  } catch (err) {
    console.error(`[FCM] Failed to remove invalid token [${deviceToken}]:`, err.message);
    return false;
  }
};

/**
 * Remove an unusable/malformed token from both FcmToken and DeviceToken tables.
 */
const removeUnusableFcmToken = async (deviceToken) => {
  if (!deviceToken || isUsableFcmToken(deviceToken)) {
    return false;
  }

  try {
    await Promise.allSettled([
      FcmToken.destroy({ where: { deviceToken } }),
      DeviceToken.destroy({ where: { deviceToken } }),
    ]);
    console.log(`[FCM] Successfully removed unusable FCM token: ${deviceToken}`);
    return true;
  } catch (err) {
    console.error(`[FCM] Failed to remove unusable token [${deviceToken}]:`, err.message);
    return false;
  }
};

module.exports = {
  isInvalidFcmTokenError,
  isUsableFcmToken,
  removeInvalidFcmToken,
  removeUnusableFcmToken,
};
