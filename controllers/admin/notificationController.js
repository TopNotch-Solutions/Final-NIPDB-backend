const { where, Op } = require("sequelize");
const Notification = require("../../models/notification");
const Admin = require("../../models/admin");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const NotificationHistory = require("../../models/notificationHistory");
const User = require("../../models/user");
const AdminNotification = require("../../models/adminNotifications");
const MsmeInformation = require("../../models/msmeInformation");
const sequelize = require("../../config/dbConfig");
const nodemailer = require("nodemailer");
const adminFirebase = require("../../config/firebaseConfig");
const DeviceToken = require("../../models/deviceToken");
const PushNotification = require("../../models/pushNotifications");
const FcmToken = require("../../models/fcmToken");
const { role } = require("./userController");

exports.createAll = async (req, res) => {
  try {
    let { notification, senderId, type, priority, notificationActive, title } =
      req.body;
    console.log(
      notification,
      senderId,
      title,
      type,
      notificationActive,
      priority
    );

    if (
      !notification ||
      !senderId ||
      !type ||
      !priority ||
      !notificationActive ||
      !title
    ) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    // if (notificationActive === "All") {
    //   title = CapitalizeFirstLetter(title);
    //   notification = CapitalizeFirstLetter(notification);
    //   type = CapitalizeFirstLetter(type);
    //   priority = CapitalizeFirstLetter(priority);

    //   const allUserEmails = await User.findAll({
    //     attributes: ["email", "id"],
    //   });

    //   if (allUserEmails && allUserEmails.length > 0) {
    //     const transporter = nodemailer.createTransport({
    //       host: 'smtp-relay.gmail.com',
    //   port: 25,
    //   tls: {
    //     rejectUnauthorized: false,
    //   },
    //     });

    //     for (const user of allUserEmails) {
    //       const mailOptions = {
    //         from: 'in4msme@nipdb.com',
    //         to: user.email,
    //         subject: title,
    //         html: `<p>Dear Entrepreneur,<br><br>${notification}.<br><br>Kind regards,<br>NIPDB</p>`,
    //       };

    //       transporter.sendMail(mailOptions, (error, info) => {
    //         if (error) {
    //           if (!res.headersSent) {
    //             return res.status(500).json({
    //               status: "FAILURE",
    //               message: "Internal server error: " + error.message,
    //             });
    //           }
    //           console.error(`Failed to send email to ${user.email}: `, error);
    //         } else {
    //           console.log(`Email sent to ${user.email}: `, info.response);
    //         }
    //       });
    //     }
    //   }
    //   const deviceTokens = await DeviceToken.findAll({
    //     where: {
    //       enabled: true
    //     },
    //     attributes: ["deviceToken"],
    //   });
    //   const fcmTokens = await FcmToken.findAll({attributes: ["deviceToken"]});

    //   const allDeviceTokens = [
    //     ...fcmTokens.map((ft) => ft.deviceToken),
    //     ...deviceTokens.map((dt) => dt.deviceToken),
    //   ];
    //   const uniqueTokens = [...new Set(allDeviceTokens)];
    //   console.log(uniqueTokens)

    //   let firebasePromises = [];
    //   if (uniqueTokens.length > 0) {
    //     const notifications = uniqueTokens.map((token) => ({
    //       notification: { title, body: notification, },
    //       data:{
    //         route: "/NotificationDetails",
    //       },
    //       android: {
    //         notification: {
    //           sound: "default",
    //         },
    //       },
    //       apns: {
    //         headers: {
    //           "apns-priority": "10",
    //         },
    //         payload: {
    //           aps: {
    //             sound: "default",
    //           },
    //         },
    //       },
    //       token,
    //     }));

    //     firebasePromises = notifications.map((message) =>
    //       adminFirebase
    //         .messaging()
    //         .send(message)
    //         .catch(async (firebaseError) => {
    //           console.error("Firebase error:", firebaseError);
    //           if (
    //             firebaseError.code ===
    //             "messaging/registration-token-not-registered"
    //           ) {
    //             const isFcmToken = await FcmToken.findOne({
    //               where: {
    //                 deviceToken: message.token,
    //               },
    //             });

    //             if (isFcmToken) {
    //               await FcmToken.destroy({
    //                 where: {
    //                   deviceToken: message.token,
    //                 },
    //               });
    //               console.log(`Fcm token Removed unregistered device token.`);
    //             } else {
    //               await DeviceToken.destroy({
    //                 where: { deviceToken: message.token },
    //               });
    //               console.log(
    //                 `Device token Removed unregistered device token.`
    //               );
    //             }
    //           }
    //         })
    //     );

    //     await Promise.all(firebasePromises);
    //   }

    //   const notificationRecords = allUserEmails.map((user) => ({
    //     userId: user.id,
    //     notification,
    //     senderId,
    //     type,
    //     priority,
    //     title,
    //     createdAt: Date.now(),
    //     viewed: false,
    //   }));

    //   await Notification.bulkCreate(notificationRecords);

    //   await NotificationHistory.create({
    //     notification,
    //     createdAt: Date.now(),
    //     senderId,
    //     type,
    //     priority,
    //   });

    //   const pushNotificationRecords = allDeviceTokens.map((token) => ({
    //     title,
    //     deviceToken: token,
    //     notification,
    //     type,
    //     priority,
    //     createdAt: Date.now(),
    //     viewed: false,
    //   }));

    //   await PushNotification.bulkCreate(pushNotificationRecords);

    //   res.status(200).json({
    //     status: "SUCCESS",
    //     message:
    //       uniqueTokens.length > 0
    //         ? "Notifications & push notification sent to all users successfully."
    //         : "Notifications sent to all users successfully.",
    //   });
    if (notificationActive === "All") {
      title = CapitalizeFirstLetter(title);
      notification = CapitalizeFirstLetter(notification);
      type = CapitalizeFirstLetter(type);
      priority = CapitalizeFirstLetter(priority);

      const allUserEmails = await User.findAll({ attributes: ["email", "id"] });

      // Send email notifications
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.gmail.com",
        port: 25,
        tls: { rejectUnauthorized: false },
      });

      allUserEmails.forEach((user) => {
        const mailOptions = {
          from: "in4msme@nipdb.com",
          to: user.email,
          subject: title,
          html: `<p>Dear Entrepreneur,<br><br>${notification}.<br><br>Kind regards,<br>NIPDB</p>`,
        };
        transporter.sendMail(mailOptions, (error) => {
          if (error)
            console.error(`Failed to send email to ${user.email}:`, error);
        });
      });

      const deviceTokens = await DeviceToken.findAll({
        where: { enabled: true },
        attributes: ["deviceToken"],
      });
      const fcmTokens = await FcmToken.findAll({ attributes: ["deviceToken"] });

      const allDeviceTokens = [
        ...fcmTokens.map((ft) => ft.deviceToken),
        ...deviceTokens.map((dt) => dt.deviceToken),
      ];
      const uniqueTokens = [...new Set(allDeviceTokens)];
      console.log(uniqueTokens);

      const firebasePromises = [];
      const notifications = uniqueTokens.map((token) => ({
        notification: 
        { title, 
          body: notification
         },
        data: {
          navigationId: "NotificationDetails" ,
          title,
           body: notification
          },
        android: { 
          priority: "high",
          notification: { sound: "default" } 
        },
        apns: {
          headers: { "apns-priority": "10" },
          payload: { aps: { sound: "default" } },
        },
        token,
      }));

      firebasePromises.push(
        ...notifications.map((message) =>
          adminFirebase
            .messaging()
            .send(message)
            .catch(async (firebaseError) => {
              console.error("Firebase error:", firebaseError);
              if (
                firebaseError.code ===
                "messaging/registration-token-not-registered"
              ) {
                const isFcmToken = await FcmToken.findOne({
                  where: { deviceToken: message.token },
                });
                if (isFcmToken) {
                  await FcmToken.destroy({
                    where: { deviceToken: message.token },
                  });
                } else {
                  await DeviceToken.destroy({
                    where: { deviceToken: message.token },
                  });
                }
              }
            })
        )
      );

      await Promise.all(firebasePromises);

      // Store notifications in the database, avoiding duplicates
      const existingPushNotifications = await PushNotification.findAll({
        where: { deviceToken: uniqueTokens },
        attributes: ["deviceToken"],
      });
      const existingTokens = existingPushNotifications.map(
        (pn) => pn.deviceToken
      );
      const newTokens = uniqueTokens.filter(
        (token) => !existingTokens.includes(token)
      );

      const pushNotificationRecords = newTokens.map((token) => ({
        title,
        deviceToken: token,
        notification,
        type,
        priority,
        createdAt: Date.now(),
        viewed: false,
      }));

      await PushNotification.bulkCreate(pushNotificationRecords);

      const notificationRecords = allUserEmails.map((user) => ({
        userId: user.id,
        notification,
        senderId,
        type,
        priority,
        title,
        createdAt: Date.now(),
        viewed: false,
      }));
      await Notification.bulkCreate(notificationRecords);

      await NotificationHistory.create({
        notification,
        createdAt: Date.now(),
        senderId,
        type,
        priority,
      });

      res.status(200).json({
        status: "SUCCESS",
        message:
          uniqueTokens.length > 0
            ? "Notifications & push notification sent to all users successfully."
            : "Notifications sent to all users successfully.",
      });
    } else {
      title = CapitalizeFirstLetter(title);
      notification = CapitalizeFirstLetter(notification);
      type = CapitalizeFirstLetter(type);
      priority = CapitalizeFirstLetter(priority);

      const allUsersWithBusinesses = await MsmeInformation.findAll({
        attributes: ["userId"],
      });

      const businessUserIds = allUsersWithBusinesses.map((user) => user.userId);

      const usersWithEmails = await User.findAll({
        attributes: ["id", "email"],
        where: {
          id: {
            [Op.in]: businessUserIds,
          },
        },
      });

      const userTokens = await FcmToken.findAll({
        attributes: ["userId", "deviceToken"],
        where: {
          role: "Business",
          userId: {
            [Op.in]: businessUserIds,
          },
        },
      });

      const transporter = nodemailer.createTransport({
        host: "smtp-relay.gmail.com",
        port: 25,
        tls: {
          rejectUnauthorized: false,
        },
      });

      for (const user of usersWithEmails) {
        const mailOptions = {
          from: "in4msme@nipdb.com",
          to: user.email,
          subject: title,
          html: `<p>Dear Entrepreneur,<br><br>${notification}.<br><br>Kind Regards,<br>NIPDB</p>`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            if (!res.headersSent) {
              return res.status(500).json({
                status: "FAILURE",
                message: "Internal server error: " + error.message,
              });
            }
          }
        });
      }

      const userIds = usersWithEmails.map((user) => user.id);
      const fcmTokens = userTokens.map((token) => token.deviceToken);

      const notifications = userIds.map((userId) => ({
        userId,
        notification,
        senderId,
        type,
        priority,
        title,
        createdAt: Date.now(),
        viewed: false,
      }));

      await NotificationHistory.create({
        notification,
        createdAt: Date.now(),
        senderId,
        type,
        priority,
      });

      await Notification.bulkCreate(notifications);

      if (fcmTokens.length > 0) {
        const firebaseNotifications = fcmTokens.map((token, index) => ({
          notification: {
            title,
            body: notification,
          },
          data: {
            navigationId: "notification",
            title,
            body: notification,
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
            },
          },
          apns: {
            headers: {
              "apns-priority": "10",
            },
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
          token,
        }));

        const firebasePromises = firebaseNotifications.map((message, index) =>
          adminFirebase
            .messaging()
            .send(message)
            .catch(async (firebaseError) => {
              console.error("Firebase error:", firebaseError);
              if (
                firebaseError.code ===
                "messaging/registration-token-not-registered"
              ) {
                const userId = userIds[index];
                await FcmToken.destroy({
                  where: { userId, deviceToken: message.token },
                });
                console.log(
                  `Removed unregistered FCM token for user: ${userId}`
                );
              }
            })
        );

        await Promise.all(firebasePromises);
      }

      res.status(200).json({
        status: "SUCCESS",
        message:
          fcmTokens.length > 0
            ? "Notifications & push notification sent to all business users successfully."
            : "Notifications sent to all business users successfully.",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.createSingle = async (req, res) => {
  const senderId = req.user.id;
  const businessId = req.params.id;
  const priority = "High";
  const type = "Alert";

  try {
    let { notification, title } = req.body;
    if (!notification || !senderId || !title) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    notification = CapitalizeFirstLetter(notification);
    title = CapitalizeFirstLetter(title);

    const admin = await Admin.findOne({
      where: { id: senderId },
    });
    if (!admin || !businessId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Empty parameter.",
      });
    }

    const msmeInfo = await MsmeInformation.findOne({
      where: { id: businessId },
      attributes: ["userId"],
    });
    if (!msmeInfo) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found",
      });
    }

    const userId = msmeInfo.userId;
    const user = await User.findOne({
      where: { id: userId },
      attributes: ["email"],
    });

    if (!user) {
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found",
      });
    }

    const userDeviceTokens = await FcmToken.findAll({
      where: { userId, role: "Business" },
      attributes: ["deviceToken"],
    });
    const deviceTokens = userDeviceTokens.map((token) => token.deviceToken);

    await Notification.create({
      userId,
      notification,
      title,
      senderId,
      createdAt: Date.now(),
      type,
      priority,
      viewed: false,
    });

    await NotificationHistory.create({
      notification,
      senderId,
      createdAt: Date.now(),
      type,
      priority,
    });

    const sendEmail = new Promise((resolve, reject) => {
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.gmail.com",
        port: 25,
        tls: {
          rejectUnauthorized: false,
        },
      });

      const mailOptions = {
        from: "in4msme@nipdb.com",
        to: user.email,
        subject: `${title}`,
        html: `<p>Dear Entrepreneur,<br><br> ${notification}.<br><br>Kind Regards,<br>NIPDB</p>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email error:", error);
          reject(new Error("Failed to send email"));
        } else {
          resolve(info);
        }
      });
    });

    await sendEmail;

    if (deviceTokens.length > 0) {
      const messages = deviceTokens.map((token) => ({
        notification: { title, body: notification },
        data: {
          navigationId: "notificationMsme",
          title, body: notification
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
          },
        },
        apns: {
          headers: {
            "apns-priority": "10",
          },
          payload: {
            aps: {
              sound: "default",
            },
          },
        },
        token,
      }));

      try {
        const responses = await Promise.all(
          messages.map((message) => adminFirebase.messaging().send(message))
        );

        console.log("Successfully sent Firebase messages:", responses);
        return res.status(200).json({
          status: "SUCCESS",
          message: "Notification sent to user and email delivered.",
        });
      } catch (firebaseError) {
        console.error("Firebase error:", firebaseError);

        if (
          firebaseError.code === "messaging/registration-token-not-registered"
        ) {
          await FcmToken.destroy({
            where: { userId, deviceToken: firebaseError.token },
          });
        }

        return res.status(500).json({
          status: "FAILURE",
          message: "Firebase error: " + firebaseError.message,
        });
      }
    } else {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Email delivered successfully, no Firebase token found.",
      });
    }
  } catch (error) {
    console.error("Internal error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.allAdminNotfication = async (req, res) => {
  try {
    const allUserNotfication = await NotificationHistory.findAll({});
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
exports.allSentByAdmin = async (req, res) => {
  try {
    let { id } = req.user;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }
    const allUserNotfication = await NotificationHistory.findAll({});
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
exports.singleSentByAdmin = async (req, res) => {
  try {
    let { id } = req.user;
    let { notificationId } = req.params;
    if (!id || !notificationId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }
    const allUserNotfication = await NotificationHistory.findOne({
      where: {
        id: notificationId,
      },
    });
    if (!allUserNotfication) {
      return res.status(404).json({
        status: "FAILURE",
        message: "There are no notifications for the provided user.",
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "Admin notifications retrieved successfully!",
      data: allUserNotfication,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.allUnRead = async (req, res) => {
  try {
    let { id } = req.user;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }
    const allUserNotfication = await AdminNotification.findAll({
      where: {
        userId: id,
        viewed: false,
      },
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
exports.allRead = async (req, res) => {
  try {
    let { id } = req.user;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }
    const allUserNotfication = await AdminNotification.findAll({
      where: {
        userId: id,
        viewed: true,
      },
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
exports.singleAdminNotfication = async (req, res) => {
  try {
    let userId = req.user.id;

    if (!userId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
    const allUserNotfication = await AdminNotification.findAll({
      where: {
        userId,
      },
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
exports.single = async (req, res) => {
  try {
    let userId = req.user.id;
    let id = req.params.id;
    if (!userId || !id) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }
    const allUserNotfication = await AdminNotification.findOne({
      where: {
        userId,
        id,
      },
    });

    if (!allUserNotfication) {
      return res.status(404).json({
        status: "FAILURE",
        message: "There are no notifications for the provided user.",
      });
    }
    await AdminNotification.update(
      { viewed: true },
      {
        where: {
          userId,
          id,
        },
      }
    );
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
exports.totalCount = async (req, res) => {
  try {
    let userId = req.user.id;

    if (!userId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "UserId is required.",
      });
    }
    const totalCount = await AdminNotification.count({
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
    let { id } = req.params;
    let userId = req.user.id;

    if (!userId || !id) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }
    const checkUser = await Admin.findOne({
      where: {
        id: userId,
      },
    });
    if (!checkUser) {
      return res.status(200).json({
        status: "FAILURE",
        message: "User does not exist!",
      });
    }
    const findNotification = await AdminNotification.findOne({
      where: {
        userId,
        id,
      },
    });
    if (!findNotification) {
      return res.status(200).json({
        status: "FAILURE",
        message: "Notification does not exist!",
      });
    }
    await AdminNotification.update(
      { viewed: true },
      {
        where: {
          userId,
          id,
        },
      }
    );
    res.status(200).json({
      status: "SUCCESS",
      message: "Notification successfully updated!",
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
    let { id } = req.params;
    let userId = req.user.id;

    if (!userId || !id) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }
    const checkUser = await Admin.findOne({
      where: {
        id: userId,
      },
    });
    if (!checkUser) {
      return res.status(200).json({
        status: "FAILURE",
        message: "User does not exist!",
      });
    }
    const findNotification = await AdminNotification.findOne({
      where: {
        userId,
        id,
      },
    });
    if (!findNotification) {
      return res.status(200).json({
        status: "FAILURE",
        message: "Notification does not exist!",
      });
    }
    await AdminNotification.destroy({
      where: {
        userId,
        id,
      },
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "Notification successfully deleted!",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
// exports.updatebulk = async (req, res) => {}
// exports.updateSingle = async (req, res) => {}
// exports.deletebulk = async (req, res) => {}
// exports.deleteSingle = async (req, res) => {}
