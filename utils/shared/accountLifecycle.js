const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const sequelize = require("../../config/dbConfig");
const User = require("../../models/user");
const MsmeInformation = require("../../models/msmeInformation");
const MsmeFounderInfo = require("../../models/msmeFounder");
const MsmeContactInfo = require("../../models/msmeContactInfo");
const MsmeAdditionalInfo = require("../../models/msmeAdditionalInfo");
const BusinessHour = require("../../models/businessHour");
const Favourite = require("../../models/msmeLike");
const BusinessRating = require("../../models/businessRating");
const BusinessReview = require("../../models/businessReview");
const BusinessReport = require("../../models/businessReport");
const Notification = require("../../models/notification");
const FcmToken = require("../../models/fcmToken");
const OTP = require("../../models/otpVerification");
const sendErrorAlert = require("./sendErrorAlert");

const ACCOUNT_RECOVERY_DAYS = 90;

const isWithinRecoveryWindow = (deletedAt) => {
  if (!deletedAt) return false;
  const deletedTime = new Date(deletedAt).getTime();
  if (Number.isNaN(deletedTime)) return false;
  const recoveryMs = ACCOUNT_RECOVERY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - deletedTime <= recoveryMs;
};

const softDeleteUserAndBusinesses = async (userId, transaction) => {
  await User.update(
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    { where: { id: userId }, transaction }
  );

  await MsmeInformation.update(
    { isVisibility: false },
    { where: { userId }, transaction }
  );

  await FcmToken.destroy({ where: { userId }, transaction });
};

const restoreUserAndBusinesses = async (userId, transaction) => {
  await User.update(
    {
      isDeleted: false,
      deletedAt: null,
      verified: true,
      isDeactivated: false,
    },
    { where: { id: userId }, transaction }
  );

  await MsmeInformation.update(
    { isVisibility: true },
    { where: { userId }, transaction }
  );
};

const removeBusinessFiles = (additionalInfo) => {
  if (!additionalInfo) return;
  const uploadDir = path.join(__dirname, "../../public/msme");
  const fields = [
    "businessLogo",
    "image1",
    "image2",
    "image3",
    "image4",
    "image5",
    "image6",
  ];
  for (const field of fields) {
    const filename = additionalInfo[field];
    if (!filename) continue;
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to remove business file:", filePath, err.message);
      }
    }
  }
};

const hardDeleteUserAndBusinesses = async (user, outerTransaction) => {
  const userId = user.id;
  const run = async (transaction) => {
    const businesses = await MsmeInformation.findAll({
      where: { userId },
      attributes: ["id"],
      transaction,
    });
    const businessIds = businesses.map((b) => b.id);

    if (businessIds.length > 0) {
      const additionalInfos = await MsmeAdditionalInfo.findAll({
        where: { businessId: { [Op.in]: businessIds } },
        transaction,
      });
      additionalInfos.forEach(removeBusinessFiles);

      await MsmeFounderInfo.destroy({
        where: { businessId: { [Op.in]: businessIds } },
        transaction,
      });
      await MsmeContactInfo.destroy({
        where: { businessId: { [Op.in]: businessIds } },
        transaction,
      });
      await MsmeAdditionalInfo.destroy({
        where: { businessId: { [Op.in]: businessIds } },
        transaction,
      });
      await BusinessHour.destroy({
        where: { businessId: { [Op.in]: businessIds } },
        transaction,
      });
      await Favourite.destroy({
        where: { businessId: { [Op.in]: businessIds } },
        transaction,
      });
      await BusinessRating.destroy({
        where: { businessId: { [Op.in]: businessIds } },
        transaction,
      });
      await BusinessReview.destroy({
        where: { businessId: { [Op.in]: businessIds } },
        transaction,
      });
      await BusinessReport.destroy({
        where: { businessId: { [Op.in]: businessIds } },
        transaction,
      });
      await MsmeInformation.destroy({
        where: { id: { [Op.in]: businessIds } },
        transaction,
      });
    }

    await Favourite.destroy({ where: { userId }, transaction });
    await BusinessRating.destroy({ where: { userId }, transaction });
    await BusinessReview.destroy({ where: { userId }, transaction });
    await BusinessReport.destroy({ where: { userId }, transaction });
    await Notification.destroy({ where: { userId }, transaction });
    await FcmToken.destroy({ where: { userId }, transaction });
    await OTP.destroy({ where: { userId }, transaction });

    if (user.profileImage) {
      const profileImagePath = path.join(
        __dirname,
        "../../public/users",
        user.profileImage
      );
      if (fs.existsSync(profileImagePath)) {
        try {
          fs.unlinkSync(profileImagePath);
        } catch (err) {
          console.error("Failed to remove profile image:", profileImagePath, err.message);
        }
      }
    }

    await User.destroy({ where: { id: userId }, transaction });
  };

  if (outerTransaction) {
    await run(outerTransaction);
    return;
  }

  const transaction = await sequelize.transaction();
  try {
    await run(transaction);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const purgeExpiredDeletedAccounts = async () => {
  const cutoff = new Date(
    Date.now() - ACCOUNT_RECOVERY_DAYS * 24 * 60 * 60 * 1000
  );

  const expiredUsers = await User.findAll({
    where: {
      isDeleted: true,
      deletedAt: { [Op.lte]: cutoff },
    },
  });

  let purged = 0;
  for (const user of expiredUsers) {
    try {
      await hardDeleteUserAndBusinesses(user);
      purged += 1;
      console.log(`[account-purge] Permanently deleted user ${user.id}`);
    } catch (error) {
      sendErrorAlert(error, {
        source: "utils/shared/accountLifecycle.js:purgeExpiredDeletedAccounts",
      });
      console.error(`[account-purge] Failed for user ${user.id}:`, error.message);
    }
  }

  return { scanned: expiredUsers.length, purged };
};

const startAccountPurgeScheduler = (intervalMs = 24 * 60 * 60 * 1000) => {
  const run = async () => {
    try {
      const result = await purgeExpiredDeletedAccounts();
      if (result.scanned > 0) {
        console.log(
          `[account-purge] scanned=${result.scanned} purged=${result.purged}`
        );
      }
    } catch (error) {
      sendErrorAlert(error, {
        source: "utils/shared/accountLifecycle.js:startAccountPurgeScheduler",
      });
      console.error("[account-purge] Scheduler run failed:", error.message);
    }
  };

  run();
  return setInterval(run, intervalMs);
};

module.exports = {
  ACCOUNT_RECOVERY_DAYS,
  isWithinRecoveryWindow,
  softDeleteUserAndBusinesses,
  restoreUserAndBusinesses,
  hardDeleteUserAndBusinesses,
  purgeExpiredDeletedAccounts,
  startAccountPurgeScheduler,
};
