const { where } = require("sequelize");
const Notification = require("../../models/notification");
const User = require("../../models/user");
const { viewed } = require("./directMessageController");
const sequelize = require("../../config/dbConfig");

exports.allUserNotfication = async (req, res) => {
  let userId = req.user.id;
   if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
  try {
    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    if (!notifications || notifications.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No notifications found for this user.",
        data: []
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "User notifications retrieved successfully.",
      data: notifications,
    });
  } catch (error) {
    console.error(`Error fetching notifications for user ${req.user?.id}:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.unreadNotification = async (req, res) => {
  const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }

  try {
    
    const unreadNotifications = await Notification.findAll({
      where: { 
        userId,
        viewed: false 
      },
      order: [["createdAt", "DESC"]],
    });

    if (!unreadNotifications || unreadNotifications.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No unread notifications found for this user.",
        data: []
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Unread notifications retrieved successfully.",
      data: unreadNotifications,
    });
  } catch (error) {
    console.error(`Error fetching unread notifications for user ${req.user?.id}:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.readNotification = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }

    const readNotifications = await Notification.findAll({
      where: {
        userId,
        viewed: true,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!readNotifications || readNotifications.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No read notifications found for this user.",
        data: []
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Read notifications retrieved successfully.",
      data: readNotifications,
    });
  } catch (error) {
    console.error(`Error fetching read notifications for user ${req.user?.id}:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};


exports.totalNotificationCount = async (req, res) => {
  const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
  try {
    
    const totalCount = await Notification.count({
      where: {
        userId,
        viewed: false,
      },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Total unread notifications count retrieved successfully.",
      count: totalCount,
    });
  } catch (error) {
    console.error(`Error fetching notification count for user ${req.user?.id}:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.updateViewed = async (req, res) => {
  const userId = req.user?.id;
    const { notificationId } = req.params;

     if (!notificationId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Notification ID required fields",
      });
    }
    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
  const t = await sequelize.transaction(); 
  try {
    

    const user = await User.findOne({ where: { id: userId }, transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist.",
      });
    }

    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
      transaction: t,
    });
    if (!notification) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Notification does not exist for this user.",
      });
    }

    await Notification.update(
      { viewed: true },
      {
        where: { id: notificationId, userId },
        transaction: t,
      }
    );

    await t.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Notification successfully marked as viewed.",
    });
  } catch (error) {
    await t.rollback();
    console.error(`Error updating notification viewed status:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};


exports.deleteSingle = async (req, res) => {
  const userId = req.user.id;
    const { notificationId } = req.params;
     if (!notificationId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Notification ID required fields",
      });
    }
    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
  const t = await sequelize.transaction();
  try {

    const checkUser = await User.findOne({ where: { id: userId }, transaction: t });
    if (!checkUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist!",
      });
    }

    const findNotification = await Notification.findOne({
      where: { id: notificationId, userId },
      transaction: t,
    });
    if (!findNotification) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Notification does not exist!",
      });
    }

    await Notification.destroy({
      where: { id: notificationId, userId },
      transaction: t,
    });

    await t.commit();

    res.status(200).json({
      status: "SUCCESS",
      message: "Notification successfully deleted!",
    });

  } catch (error) {
    await t.rollback();
    console.error("Delete Notification Error:", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
