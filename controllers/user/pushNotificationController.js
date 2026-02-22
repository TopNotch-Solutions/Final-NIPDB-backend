const { where } = require("sequelize");
const PushNotification = require("../../models/pushNotifications");
const User = require("../../models/user");
const { viewed } = require("./directMessageController");
const sequelize = require("../../config/dbConfig");

exports.allUserNotification = async (req, res) => {
  const { deviceToken } = req.params;

    if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device token is required.",
      });
    }

  try {
    
    const notifications = await PushNotification.findAll({
      where: { deviceToken },
      order: [["createdAt", "DESC"]],
    });

    if (!notifications || notifications.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No notifications found for the provided device token.",
        data: []
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "User notifications retrieved successfully!",
      data: notifications,
    });

  } catch (error) {
    console.error("Fetch Push Notifications Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.unreadNotification = async (req, res) => {
  const { deviceToken } = req.params;

    if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device token is required.",
      });
    }

  try {
    
    const unreadNotifications = await PushNotification.findAll({
      where: {
        deviceToken,
        viewed: false,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!unreadNotifications || unreadNotifications.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No unread notifications found for the provided device token.",
        data: []
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Unread notifications retrieved successfully!",
      data: unreadNotifications,
    });

  } catch (error) {
    console.error("Fetch Unread Notifications Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.readNotification = async (req, res) => {
  let {deviceToken} = req.params;

    if (!deviceToken) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Device token is required.",
      });
    }
  try {
    
    const readUserNotfication = await PushNotification.findAll({
      where: {
        deviceToken,
        viewed:true
      },
      order: [["createdAt", "DESC"]],
    });
    if (!readUserNotfication) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "There are no notifications for the provided device token.",
        data: []
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "All user read notifications retrieved successfully!",
      data: readUserNotfication,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.totalNotficationCount = async (req, res) => {
  let {deviceToken}  = req.params;

    if (!deviceToken) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Device token is required.",
      });
    }

  try {
    
    const totalCount = await PushNotification.count({
      where: {
        deviceToken,
        viewed: false,
      },
    });
    if (!totalCount) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Total count successfully retrieved!",
        count: totalCount,
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "Total count successfully retrieved!",
      count: totalCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.updateViewed = async (req, res) => {
  const { deviceToken } = req.params;

    if (!deviceToken) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Device token is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {
    
    const notification = await PushNotification.findOne({
      where: { deviceToken },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!notification) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Notification does not exist.",
      });
    }

    if (notification.viewed) {
      await transaction.commit();
      return res.status(200).json({
        status: "SUCCESS",
        message: "Notification already marked as viewed.",
      });
    }

    notification.viewed = true;
    await notification.save({ transaction });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Notification successfully marked as viewed.",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error updating viewed status:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.deleteSingle = async (req, res) => {
   const { deviceToken } = req.params;

    if (!deviceToken) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Device token is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {

    const notification = await PushNotification.findOne({
      where: { deviceToken },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!notification) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Notification does not exist.",
      });
    }

    await notification.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Notification successfully deleted.",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting notification:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};
