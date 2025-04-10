const { where } = require("sequelize");
const PushNotification = require("../../models/pushNotifications");
const User = require("../../models/user");
const { viewed } = require("./directMessageController");

exports.allUserNotfication = async (req, res) => {
  try {
    let {deviceToken} = req.params;

    if (!deviceToken) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
    const allUserNotfication = await PushNotification.findAll({
      where: {
        deviceToken,
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
    let {deviceToken} = req.params;

    if (!deviceToken) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
    const unreadUserNotfication = await PushNotification.findAll({
      where: {
        deviceToken,
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
    let {deviceToken} = req.params;

    if (!deviceToken) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
    const readUserNotfication = await PushNotification.findAll({
      where: {
        deviceToken,
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
    let {deviceToken}  = req.params;

    if (!deviceToken) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
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
  try {
    let {deviceToken} = req.params;

    if (!deviceToken) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }
    const checkNotification = await PushNotification.findOne({
      where: {
        deviceToken
      },
    });
    if (!checkNotification) {
      return res.status(200).json({
        status: "FAILURE",
        message: "Notification does not exist!",
      });
    }
    await PushNotification.update(
      { viewed: true },
      {
        where: {
            deviceToken
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
    let {deviceToken} = req.params;

    if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }

    const findNotification = await PushNotification.findOne({
      where: {
        deviceToken
       }, // Ensure 'id' is correct field
    });
    if (!findNotification) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Notification does not exist!",
      });
    }

    await PushNotification.destroy({ where: { deviceToken } });
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
