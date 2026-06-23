const adminFirebase = require("../../config/firebaseConfig");
const DeviceToken = require("../../models/deviceToken");
const {
  isUsableFcmToken,
  removeInvalidFcmToken,
  removeUnusableFcmToken,
  isInvalidFcmTokenError,
} = require("./fcmTokenCleanup");

const DEFAULT_ANDROID_CHANNEL_ID = "default-channel-id";

const stringifyData = (data = {}) =>
  Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = String(value);
    }
    return acc;
  }, {});

const buildFcmMessage = ({ title, body, data = {}, token }) => {
  const normalizedData = stringifyData({
    title,
    body,
    ...data,
  });

  return {
    token,
    notification: { title, body },
    data: normalizedData,
    android: {
      priority: "high",
      notification: {
        channelId: DEFAULT_ANDROID_CHANNEL_ID,
        sound: "default",
        defaultSound: true,
        defaultVibrateTimings: true,
        priority: "high",
        visibility: "public",
      },
    },
    apns: {
      headers: {
        "apns-priority": "10",
        "apns-push-type": "alert",
      },
      payload: {
        aps: {
          alert: { title, body },
          sound: "default",
          "content-available": 1,
        },
      },
    },
  };
};

const removeStaleDeviceToken = async (deviceToken, firebaseError) => {
  const removed = await removeInvalidFcmToken(deviceToken, firebaseError);
  if (!removed) return false;

  try {
    await DeviceToken.destroy({ where: { deviceToken } });
  } catch (error) {
    console.error("Failed to remove stale device token:", error.message);
  }

  return true;
};

const sendFcmToToken = async (deviceToken, { title, body, data = {} }) => {
  if (!isUsableFcmToken(deviceToken)) {
    await removeUnusableFcmToken(deviceToken);
    return null;
  }

  const message = buildFcmMessage({ title, body, data, token: deviceToken });

  try {
    return await adminFirebase.messaging().send(message);
  } catch (firebaseError) {
    console.error("Firebase error:", firebaseError);
    await removeStaleDeviceToken(deviceToken, firebaseError);
    return null;
  }
};

const sendFcmToTokens = async (deviceTokens, options) => {
  const tokens = deviceTokens
    .map((entry) => (typeof entry === "string" ? entry : entry?.deviceToken))
    .filter(Boolean);

  return Promise.all(tokens.map((token) => sendFcmToToken(token, options)));
};

module.exports = {
  buildFcmMessage,
  sendFcmToToken,
  sendFcmToTokens,
  isInvalidFcmTokenError,
  removeStaleDeviceToken,
  DEFAULT_ANDROID_CHANNEL_ID,
};
