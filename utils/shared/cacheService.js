const redisClient = require("../../config/redis");

const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

/**
 * Retrieve parsed JSON value from Redis by key.
 * Falls back to null if key does not exist or Redis is disconnected.
 */
const getCache = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) return null;
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error(`Redis GET error for key [${key}]:`, error.message);
    return null;
  }
};

/**
 * Save value as JSON string to Redis with expiration TTL.
 */
const setCache = async (key, value, ttl = CACHE_TTL) => {
  try {
    if (!redisClient || !redisClient.isOpen) return false;
    if (value === undefined || value === null) return false;
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    return true;
  } catch (error) {
    console.error(`Redis SET error for key [${key}]:`, error.message);
    return false;
  }
};

/**
 * Delete one or more keys from Redis.
 */
const delCache = async (...keys) => {
  try {
    if (!redisClient || !redisClient.isOpen || keys.length === 0) return false;
    const flatKeys = keys.flat().filter(Boolean);
    if (flatKeys.length === 0) return false;
    await redisClient.del(flatKeys);
    return true;
  } catch (error) {
    console.error(`Redis DEL error for keys [${keys}]:`, error.message);
    return false;
  }
};

/**
 * Scan and delete all keys matching a glob-style pattern (e.g., "town:region:*").
 */
const delPattern = async (pattern) => {
  try {
    if (!redisClient || !redisClient.isOpen) return false;
    const matchedKeys = [];
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      matchedKeys.push(key);
    }
    if (matchedKeys.length > 0) {
      await redisClient.del(matchedKeys);
    }
    return true;
  } catch (error) {
    console.error(`Redis delPattern error for pattern [${pattern}]:`, error.message);
    return false;
  }
};

module.exports = {
  redisClient,
  CACHE_TTL,
  getCache,
  setCache,
  delCache,
  delPattern,
};
