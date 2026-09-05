const adminFirebase = require("../../config/firebaseConfig");
const DeviceToken = require("../../models/deviceToken");
const sendErrorAlert = require('./sendErrorAlert.js');
const {
  isUsableFcmToken,
  removeInvalidFcmToken,
  removeUnusableFcmToken,
  isInvalidFcmTokenError,
} = require("./fcmTokenCleanup");

const DEFAULT_ANDROID_CHANNEL_ID = "default-channel-id";

const getApiBaseUrl = () => {
  const env = (process.env.ENVIRONMENT || "").toLowerCase();
  if (env === "prod" || env === "production") {
    return "https://in4msmeportalend.nipdb.com";
  }
  if (env === "uat") {
    return "http://uat-api.erongored.com.na";
  }
  return process.env.API_BASE_URL || "http://uat-api.erongored.com.na";
};

const resolveNotificationImageUrl = (image, defaultFolder = null) => {
  if (!image || typeof image !== "string") {
    return undefined;
  }

  const trimmed = image.trim();
  if (!trimmed) {
    return undefined;
  }

  // Already a full URL (http:// or https://) or base64 data URI
  if (/^(https?:\/\/|data:)/i.test(trimmed)) {
    return trimmed;
  }

  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  const cleanPath = trimmed.replace(/^\/+/, "");

  // If path already starts with a known public subdirectory
  const knownFolders = [
    "profile-images",
    "msmes",
    "mobile-images",
    "opportunities",
    "primary-industries",
    "bsos",
    "reviews",
    "users",
  ];

  for (const folder of knownFolders) {
    if (cleanPath.startsWith(`${folder}/`)) {
      return `${baseUrl}/${cleanPath}`;
    }
  }

  // If an explicit default folder was passed
  if (defaultFolder && typeof defaultFolder === "string") {
    const cleanFolder = defaultFolder.replace(/^\/+|\/+$/g, "");
    return `${baseUrl}/${cleanFolder}/${cleanPath}`;
  }

  // Infer folder based on filename prefixes commonly used in uploads
  if (cleanPath.startsWith("profile-image") || cleanPath.startsWith("user")) {
    return `${baseUrl}/profile-images/${cleanPath}`;
  }
  if (
    cleanPath.startsWith("businessLogo") ||
    cleanPath.startsWith("image1") ||
    cleanPath.startsWith("image2") ||
    cleanPath.startsWith("image3") ||
    cleanPath.startsWith("image4") ||
    cleanPath.startsWith("image5") ||
    cleanPath.startsWith("image6")
  ) {
    return `${baseUrl}/msmes/${cleanPath}`;
  }
  if (cleanPath.startsWith("mobile-image") || cleanPath.startsWith("mobileImage")) {
    return `${baseUrl}/mobile-images/${cleanPath}`;
  }
  if (cleanPath.startsWith("opportunity") || cleanPath.startsWith("opportunities")) {
    return `${baseUrl}/opportunities/${cleanPath}`;
  }
  if (cleanPath.startsWith("primary-industr") || cleanPath.startsWith("industryIcon")) {
    return `${baseUrl}/primary-industries/${cleanPath}`;
  }
  if (cleanPath.startsWith("bso")) {
    return `${baseUrl}/bsos/${cleanPath}`;
  }

  return `${baseUrl}/msmes/${cleanPath}`;
};

const stringifyData = (data = {}) =>
  Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = String(value);
    }
    return acc;
  }, {});

const buildFcmMessage = ({
  title,
  body,
  imageUrl,
  image,
  sound = "default",
  channelId = DEFAULT_ANDROID_CHANNEL_ID,
  data = {},
  token,
}) => {
  const rawImage =
    (typeof imageUrl === "string" && imageUrl.trim()) ||
    (typeof image === "string" && image.trim()) ||
    (data && typeof data.imageUrl === "string" && data.imageUrl.trim()) ||
    (data && typeof data.image === "string" && data.image.trim()) ||
    undefined;

  const resolvedImage = resolveNotificationImageUrl(rawImage);

  const resolvedSound =
    (typeof sound === "string" && sound.trim()) ||
    (data && typeof data.sound === "string" && data.sound.trim()) ||
    "default";

  const resolvedChannelId =
    (typeof channelId === "string" && channelId.trim()) ||
    (data && typeof data.channelId === "string" && data.channelId.trim()) ||
    DEFAULT_ANDROID_CHANNEL_ID;

  const isDefaultSound = !resolvedSound || resolvedSound.toLowerCase() === "default";

  const normalizedData = stringifyData({
    title,
    body,
    ...data,
    ...(resolvedImage ? { image: resolvedImage, imageUrl: resolvedImage } : {}),
    sound: resolvedSound,
    channelId: resolvedChannelId,
  });

  return {
    token,
    notification: {
      title,
      body,
      ...(resolvedImage ? { imageUrl: resolvedImage } : {}),
    },
    data: normalizedData,
    android: {
      priority: "high",
      notification: {
        channelId: resolvedChannelId,
        sound: resolvedSound,
        defaultSound: isDefaultSound,
        defaultVibrateTimings: true,
        priority: "high",
        visibility: "public",
        ...(resolvedImage ? { imageUrl: resolvedImage } : {}),
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
          sound: resolvedSound,
          "content-available": 1,
          ...(resolvedImage ? { "mutable-content": 1 } : {}),
        },
      },
      ...(resolvedImage
        ? {
            fcmOptions: {
              imageUrl: resolvedImage,
            },
          }
        : {}),
    },
    ...(resolvedImage
      ? {
          webpush: {
            notification: {
              image: resolvedImage,
              icon: resolvedImage,
            },
          },
        }
      : {}),
  };
};

const removeStaleDeviceToken = async (deviceToken, firebaseError) => {
  return await removeInvalidFcmToken(deviceToken, firebaseError);
};

const sendFcmToToken = async (deviceToken, options = {}) => {
  if (!isUsableFcmToken(deviceToken)) {
    await removeUnusableFcmToken(deviceToken);
    return null;
  }

  const message = buildFcmMessage({ ...options, token: deviceToken });

  try {
    return await adminFirebase.messaging().send(message);
  } catch (firebaseError) {
    if (isInvalidFcmTokenError(firebaseError)) {
      console.warn(`[FCM] Token is not registered or invalid, removed from database: ${deviceToken}`);
      await removeStaleDeviceToken(deviceToken, firebaseError);
      return null;
    }

    sendErrorAlert(firebaseError, { source: "utils/shared/fcmMessaging.js" });
    console.error("Firebase error:", firebaseError);
    await removeStaleDeviceToken(deviceToken, firebaseError);
    return null;
  }
};

const sendFcmToTokens = async (deviceTokens, options = {}) => {
  if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
    return [];
  }

  const tokens = [
    ...new Set(
      deviceTokens
        .map((entry) => (typeof entry === "string" ? entry : entry?.deviceToken))
        .filter(Boolean)
    ),
  ];

  return Promise.all(tokens.map((token) => sendFcmToToken(token, options)));
};

module.exports = {
  buildFcmMessage,
  sendFcmToToken,
  sendFcmToTokens,
  isInvalidFcmTokenError,
  removeStaleDeviceToken,
  resolveNotificationImageUrl,
  getApiBaseUrl,
  DEFAULT_ANDROID_CHANNEL_ID,
};
