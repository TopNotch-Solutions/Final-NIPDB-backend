const { where } = require("sequelize");
const Notification = require("../../models/notification");
const User = require("../../models/user");
const { viewed } = require("./directMessageController");

exports.allUserNotfication = async (req, res) => {
  try {
    let userId = req.user.id;

    if (!userId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
    const allUserNotfication = await Notification.findAll({
      where: {
        userId,
      },
      order: [["createdAt", "DESC"]],
    });
    if (!allUserNotfication) {
      return res.status(404).json({
        status: "FAILURE",
        message: "There are no notifications for the provided user.",
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "All user notifications retrieved successfully!",
      data: allUserNotfication,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.unreadNotification = async (req, res) => {
  try {
    let userId = req.user.id;

    if (!userId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
    const unreadUserNotfication = await Notification.findAll({
      where: {
        userId,
        viewed: false
      },
      order: [["createdAt", "DESC"]],
    });
    if (!unreadUserNotfication) {
      return res.status(404).json({
        status: "FAILURE",
        message: "There are no notifications for the provided user.",
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "All user unread notifications retrieved successfully!",
      data: unreadUserNotfication,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.readNotification = async (req, res) => {
  try {
    let userId = req.user.id;

    if (!userId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
    const readUserNotfication = await Notification.findAll({
      where: {
        userId,
        viewed:true
      },
      order: [["createdAt", "DESC"]],
    });
    if (!readUserNotfication) {
      return res.status(404).json({
        status: "FAILURE",
        message: "There are no notifications for the provided user.",
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
  try {
    let userId  = req.user.id;

    if (!userId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
    const totalCount = await Notification.count({
      where: {
        userId,
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
  try {
    let userId = req.user.id;
    let { notificationId } = req.params;

    if (!notificationId  || !userId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }
    const checkUser = await User.findOne({
      where: {
        id:userId,
      },
    });
    if (!checkUser) {
      return res.status(200).json({
        status: "FAILURE",
        message: "User does not exist!",
      });
    }
    const checkNotification = await Notification.findOne({
      where: {
        id:notificationId,
      },
    });
    if (!checkNotification) {
      return res.status(200).json({
        status: "FAILURE",
        message: "Notification does not exist!",
      });
    }
    await Notification.update(
      { viewed: true },
      {
        where: {
          id: notificationId,
          userId,
        },
      }
    );
    res.status(200).json({
      status: "SUCCESS",
      message: "Notification successfully viewed!",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.deleteSingle = async (req, res) => {
  try {
    let userId = req.user.id;
    let { notificationId } = req.params;

    if (!userId || !notificationId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }

    const checkUser = await User.findOne({ where: { id: userId } });
    if (!checkUser) {
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist!",
      });
    }

    const findNotification = await Notification.findOne({
      where: { id: notificationId, userId: userId }, // Ensure 'id' is correct field
    });
    if (!findNotification) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Notification does not exist!",
      });
    }

    await Notification.destroy({ where: { id: notificationId, userId: userId } });
    res.status(200).json({
      status: "SUCCESS",
      message: "Notification successfully deleted!",
    });
  } catch (error) {
    console.error("Error deleting notification:", error); // Log full error object
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
