const FcmToken = require("../../models/fcmToken");

const UNREGISTERED_FCM_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

const isInvalidFcmTokenError = (error) => {
  if (!error?.code) return false;

  if (UNREGISTERED_FCM_ERROR_CODES.has(error.code)) {
    return true;
  }

  if (
    error.code === "messaging/invalid-argument" &&
    /not a valid FCM registration token/i.test(error.message || "")
  ) {
    return true;
  }

  return false;
};

const isUsableFcmToken = (deviceToken) => {
  if (typeof deviceToken !== "string") return false;
  return deviceToken.trim().length >= 50;
};

const removeInvalidFcmToken = async (deviceToken, firebaseError) => {
  if (!deviceToken || !isInvalidFcmTokenError(firebaseError)) {
    return false;
  }

  await FcmToken.destroy({ where: { deviceToken } });
  console.log(`Removed invalid FCM token: ${deviceToken}`);
  return true;
};

const removeUnusableFcmToken = async (deviceToken) => {
  if (!deviceToken || isUsableFcmToken(deviceToken)) {
    return false;
  }

  await FcmToken.destroy({ where: { deviceToken } });
  console.log(`Removed unusable FCM token: ${deviceToken}`);
  return true;
};

module.exports = {
  isInvalidFcmTokenError,
  isUsableFcmToken,
  removeInvalidFcmToken,
  removeUnusableFcmToken,
};
