const express = require("express");
const bodyParser = require("body-parser");
const sequelize = require("./config/dbConfig");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require("http");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const User = require("./models/user");
const Notification = require("./models/notification");
const Message = require("./models/directMessage");
const AdminNotification = require("./models/adminNotifications");
const Conversation = require("./models/conversation");
const { Op } = require("sequelize");
require("dotenv").config();

const MsmeInformation = require("./models/msmeInformation");
const MsmeAdditionalInfo = require("./models/msmeAdditionalInfo");
const authAdminRouter = require("./routes/adminRoutes/authRoute");
const authUserRouter = require("./routes/userRoutes/authRoute");
const bsoAdminRouter = require("./routes/adminRoutes/bsoRoute");
const bsoUserRouter = require("./routes/userRoutes/bsoRoutes");
const regionAdminRouter = require("./routes/adminRoutes/regionRoute");
const regionUserRouter = require("./routes/userRoutes/regionRoute");
const townAdminRouter = require("./routes/adminRoutes/townRoute");
const townUserRouter = require("./routes/userRoutes/townRoute");
const primaryIndustryAdminRouter = require("./routes/adminRoutes/primaryIndustryRoute");
const primaryIndustryUserRouter = require("./routes/userRoutes/primaryIndustryRoute");
const secondaryIndustryAdminRouter = require("./routes/adminRoutes/secondaryIndustryRoute");
const secondaryIndustryUserRouter = require("./routes/userRoutes/secondaryIndustryRoute");
const msmeAdminRouter = require("./routes/adminRoutes/msmeRoute");
const msmeUserRouter = require("./routes/userRoutes/msmeRoute");
const notificationAdminRouter = require("./routes/adminRoutes/notificationRoute");
const notificationUserRouter = require("./routes/userRoutes/notificationRoute");
const pushNotificationUserRouter = require("./routes/userRoutes/pushNotificationRoute");
const mobileImageAdminRouter = require("./routes/adminRoutes/mobileImageRoute");
const mobileImageUserRouter = require("./routes/userRoutes/mobileImageRoute");
const opportunityAdminRouter = require("./routes/adminRoutes/opportunityRoute");
const opportunityUserRouter = require("./routes/userRoutes/opportunityRoute");
const directMessageUserRouter = require("./routes/userRoutes/directMessageRoute");
const businessFeedbackUserRouter = require("./routes/userRoutes/businessFeedbackRoute");
const userAdminRouter = require("./routes/adminRoutes/userRoute");
const Admin = require("./models/admin");
const NotificationHistory = require("./models/notificationHistory");
const { where } = require("sequelize");
const CapitalizeFirstLetter = require("./utils/shared/capitalizeFirstLetter");
const { title } = require("process");
const FcmToken = require("./models/fcmToken");
const BusinessReport = require("./models/businessReport");
const { sendFcmToTokens } = require("./utils/shared/fcmMessaging");
const sendErrorAlert = require('./utils/shared/sendErrorAlert');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://in4msmeportal.nipdb.com", "http://uat-api.erongored.com.na", "http://41.219.71.112:8080"],
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  },
});
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 18, // Limit each IP to 100 requests per minute
// });

// app.use(limiter)

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.set("trust proxy", 1);
app.use(
  cors({
    origin: ["http://localhost:3000", "https://in4msmeportal.nipdb.com", "http://uat-api.erongored.com.na", "http://41.219.71.112:8080"],
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
    exposedHeaders: ["Authorization", "x-access-token", "data-access-token"],
  })
);

app.use("/auth/admin", authAdminRouter);
app.use("/auth/user", authUserRouter);
app.use("/bso/admin", bsoAdminRouter);
app.use("/bso/user", bsoUserRouter);
app.use("/region/admin", regionAdminRouter);
app.use("/region/user", regionUserRouter);
app.use("/town/admin", townAdminRouter);
app.use("/town/user", townUserRouter);
app.use("/primaryIndustry/admin", primaryIndustryAdminRouter);
app.use("/primaryIndustry/user", primaryIndustryUserRouter);
app.use("/secondaryIndustry/admin", secondaryIndustryAdminRouter);
app.use("/secondaryIndustry/user", secondaryIndustryUserRouter);
app.use("/msme/admin", msmeAdminRouter);
app.use("/msme/user", msmeUserRouter);
app.use("/notifications/admin", notificationAdminRouter);
app.use("/notifications/user", notificationUserRouter);
app.use("/app-notification", pushNotificationUserRouter);
app.use("/admin/mobile-images", mobileImageAdminRouter);
app.use("/user/mobile-images", mobileImageUserRouter);
app.use("/opportunities/admin", opportunityAdminRouter);
app.use("/opportunities/user", opportunityUserRouter);
app.use("/directMessaging", directMessageUserRouter);
app.use("/businessFeedback", businessFeedbackUserRouter);
app.use("/system", userAdminRouter);
app.use("/*", (req, res) => {
  res.status(404).json({
    status: "FAILURE",
    message: "Route not found",
  });
});


let onlineUsers = [];
let onlineBusiness = [];

const addNewUser = (id, role, socketId) => {
  console.log("addNewUser:", id, role, socketId);
  if (!id) return;
  const existingUser = onlineUsers.find(
    (user) => String(user.id) === String(id) && user.role === role
  );
  if (existingUser) {
    existingUser.socketId = socketId;
  } else {
    onlineUsers.push({ id, role, socketId });
  }
};

const addNewBusiness = (id, role, socketId) => {
  console.log("addNewBusiness:", id, role, socketId);
  if (!id) return;
  const existingBusiness = onlineBusiness.find(
    (user) => String(user.id) === String(id) && user.role === role
  );
  if (existingBusiness) {
    existingBusiness.socketId = socketId;
  } else {
    onlineBusiness.push({ id, role, socketId });
  }
};
const addNewBusinesss = addNewBusiness;

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};
const removeBusiness = (socketId) => {
  onlineBusiness = onlineBusiness.filter((user) => user.socketId !== socketId);
};

const getUser = (id, role) => {
  if (!id) return null;
  return onlineUsers.find(
    (user) => String(user.id) === String(id) && (!role || user.role === role)
  );
};

const getBusiness = (id, role) => {
  if (!id) return null;
  return onlineBusiness.find(
    (user) => String(user.id) === String(id) && (!role || user.role === role)
  );
};

const getAllOnlineUsers = () => {
  return onlineUsers.map((user) => ({ id: user.id, role: user.role }));
};

const getAllOnlineBusiness = () => {
  return onlineBusiness.map((user) => ({ id: user.id, role: user.role }));
};

const removeUserByRole = (id, role) => {
  onlineUsers = onlineUsers.filter(
    (user) => !(String(user.id) === String(id) && user.role === role)
  );
};

const removeBusinessByRole = (id, role) => {
  onlineBusiness = onlineBusiness.filter(
    (user) => !(String(user.id) === String(id) && user.role === role)
  );
};

const getUnreadCountForSender = async ({ receiverId, senderId, conversationId }) => {
  if (!receiverId || !senderId) return 0;

  const whereClause = {
    receiverId,
    senderId,
    viewed: false,
    receiverDelete: false,
  };

  if (conversationId) {
    whereClause.conversationId = conversationId;
  }

  return Message.count({ where: whereClause });
};

const getAllUnreadCount = async ({ receiverId }) => {
  if (!receiverId) return 0;

  return Message.count({
    where: {
      receiverId,
      userType: "User",
      viewed: false,
      receiverDelete: false,
    },
  });
};

const getAllBusinessUnreadCount = async ({ receiverId, businessId }) => {
  if (!receiverId || !businessId) return 0;

  const parsedBusinessId = Number(businessId) || businessId;

  const conversations = await Conversation.findAll({
    where: { businessId: parsedBusinessId },
    attributes: ["id"],
    raw: true,
  });

  const conversationIds = conversations.map((conversation) => conversation.id);
  if (!conversationIds.length) return 0;

  return Message.count({
    where: {
      receiverId,
      conversationId: { [Op.in]: conversationIds },
      viewed: false,
      receiverDelete: false,
    },
  });
};

const buildSocketAck = (callback) => {
  return {
    success: (payload = {}) => {
      if (typeof callback === "function") {
        callback({ status: "SUCCESS", ...payload });
      }
    },
    failure: (message = "Internal server error", payload = {}) => {
      if (typeof callback === "function") {
        callback({ status: "FAILURE", message, ...payload });
      }
    },
  };
};

const onSocketEvent = (socket, eventName, handler) => {
  socket.on(eventName, async (payload, callback) => {
    const ack = buildSocketAck(callback);
    try {
      await handler(payload, ack, callback);
    } catch (error) {
    sendErrorAlert(error, { source: "server.js" });
      console.error(`Socket event error: ${eventName}`, error);
      ack.failure(error.message || "Internal server error");
    }
  });
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  socket.on("addNewUser", (id, role) => {
    addNewUser(id, role, socket.id);
    console.log(onlineUsers);
  });

  socket.on("addNewBusiness", (id, role) => {
    addNewBusinesss(id, role, socket.id);
    console.log(onlineBusiness);
  });

  socket.on("getOnlineUsers", () => {
    socket.emit("onlineUsersList", getAllOnlineUsers());
  });

  socket.on("getOnlineBusiness", () => {
    socket.emit("onlineBusinessList", getAllOnlineBusiness());
  });

  socket.on("removeUser", (id, role) => {
    removeUserByRole(id, role);
    console.log(`Removed ${role} for user ${id}`);
  });

  socket.on("removeBusiness", (id, role) => {
    removeBusinessByRole(id, role);
    console.log(`Removed ${role} for user ${id}`);
  });

  socket.on(
    "sendToSingleNotificationAdmin",
    async ({ userId, notification, type, priority, senderId }) => {
      let role = "User";
      const receiver = getUser(userId, role);
      const newCapitalizedNotification = CapitalizeFirstLetter(notification);
      if (userId && notification && type && priority) {
        const checkNewAdminExist = await Admin.findOne({
          where: {
            id: senderId,
          },
        });
        const checkNewUserExist = await User.findOne({
          where: {
            id: userId,
          },
        });

        if (checkNewAdminExist && checkNewUserExist) {
          const newNotification = await Notification.create({
            userId,
            notification: newCapitalizedNotification,
            type,
            priority,
            createdAt: Date.now(),
            senderId: senderId,
          });

          if (newNotification) {
            const allNewNotifications = await Notification.findAll({
              where: {
                userId,
                viewed: false,
              },
            });
            const allNewNotificationCount = await Notification.count({
              where: {
                userId,
                viewed: false,
              },
            });

            if (allNewNotificationCount && allNewNotifications) {
              if (receiver) {
                io.to(receiver.socketId).emit(
                  "receiveFromSingleNotificationAdmin",
                  {
                    notifications: allNewNotifications,
                    notificationCount: allNewNotificationCount,
                  }
                );
              }
            }
          }
        }
      }
    }
  );

  socket.on(
    "sendToAllUsers",
    async ({ notification, type, priority, senderId }) => {
      try {
        let role = "User";
        const newCapitalizedNotification = CapitalizeFirstLetter(notification);
        if (notification && type && priority && senderId) {
          const checkNewAdminExist = await Admin.findOne({
            where: { id: senderId },
          });

          if (!checkNewAdminExist) {
            console.error("Admin not found.");
            return;
          }
          const users = await User.findAll({
            attributes: ["id"],
          });

          if (users.length === 0) {
            console.error("No users found.");
            return;
          }

          const notifications = users.map((user) => ({
            userId: user.id,
            notification: newCapitalizedNotification,
            senderId,
            type,
            priority,
            createdAt: Date.now(),
            viewed: false,
          }));

          await NotificationHistory.create({
            notification: newCapitalizedNotification,
            createdAt: Date.now(),
            senderId,
            type,
            priority,
          });
          await Notification.bulkCreate(notifications);

          for (const user of users) {
            const userNotifications = await Notification.findAll({
              where: {
                userId: user.id,
                viewed: false,
              },
            });

            const userNotificationCount = await Notification.count({
              where: {
                userId: user.id,
                viewed: false,
              },
            });

            const userSocket = getUser(user.id, role);
            if (userSocket) {
              io.to(userSocket.socketId).emit("receiveFromAllNotification", {
                notifications: userNotifications,
                notificationCount: userNotificationCount,
              });
            }
          }
        }
      } catch (error) {
    sendErrorAlert(error, { source: "server.js" });
        console.error("Error sending notifications:", error);
      }
    }
  );

  onSocketEvent(
    socket,
    "count",
    async ({ receiverId, senderId, conversationId } = {}, ack) => {
      if (!receiverId || !senderId) {
        ack.failure("Receiver and sender IDs are required.");
        return;
      }

      const count = await getUnreadCountForSender({
        receiverId,
        senderId,
        conversationId,
      });

      ack.success({ count });
    }
  );

  onSocketEvent(socket, "allCount", async ({ receiverId } = {}, ack) => {
    if (!receiverId) {
      ack.failure("Receiver ID is required.");
      return;
    }

    const count = await getAllUnreadCount({ receiverId });
    ack.success({ count });
  });

  onSocketEvent(
    socket,
    "allBusinessCount",
    async ({ receiverId, businessId } = {}, ack) => {
      if (!receiverId || !businessId) {
        ack.failure("Receiver/Business ID is required.");
        return;
      }

      const count = await getAllBusinessUnreadCount({ receiverId, businessId });
      ack.success({ count });
    }
  );

  onSocketEvent(
    socket,
    "viewed",
    async ({ receiverId, senderId, conversationId, businessId } = {}, ack) => {
      if (!receiverId || !senderId || !conversationId) {
        ack.failure("Empty parameters.");
        return;
      }

      const checkUser = await User.findOne({
        where: { id: receiverId },
      });

      if (!checkUser) {
        ack.failure("User does not exist!");
        return;
      }

      const [updatedCount] = await Message.update(
        { viewed: true },
        {
          where: {
            receiverId,
            senderId,
            conversationId,
            viewed: false,
            receiverDelete: false,
          },
        }
      );

      const senderCount = await getUnreadCountForSender({
        receiverId,
        senderId,
        conversationId,
      });
      const allCount = await getAllUnreadCount({ receiverId });
      const businessCount = await getAllBusinessUnreadCount({
        receiverId,
        businessId: Number(businessId) || businessId,
      });

      // Notify the original message sender that their messages were read (read receipt)
      if (updatedCount > 0) {
        const originalSenderUser = getUser(senderId, "User");
        const originalSenderBusiness = getBusiness(senderId, "Business");
        const originalSenderSocket = originalSenderUser || originalSenderBusiness;
        if (originalSenderSocket) {
          io.to(originalSenderSocket.socketId).emit("messages-viewed", {
            conversationId,
            viewedBy: receiverId,
            senderId,
            count: updatedCount,
          });
        }
      }

      ack.success({
        count: updatedCount,
        counts: {
          count: senderCount,
          allCount,
          allBusinessCount: businessCount,
        },
      });
    }
  );

  // Typing indicators
  socket.on("typing", ({ conversationId, senderId, receiverId, role = "User" } = {}) => {
    if (!receiverId) return;
    const targetSocket =
      role === "Business"
        ? getBusiness(receiverId, "Business")
        : getUser(receiverId, "User");
    if (targetSocket) {
      io.to(targetSocket.socketId).emit("user-typing", {
        conversationId,
        senderId,
      });
    }
  });

  socket.on("stop-typing", ({ conversationId, senderId, receiverId, role = "User" } = {}) => {
    if (!receiverId) return;
    const targetSocket =
      role === "Business"
        ? getBusiness(receiverId, "Business")
        : getUser(receiverId, "User");
    if (targetSocket) {
      io.to(targetSocket.socketId).emit("user-stop-typing", {
        conversationId,
        senderId,
      });
    }
  });
  // message is still a notification.
  onSocketEvent(
    socket,
    "send-chat-message-user",
    async ({ receiverId, message, senderId, businessId } = {}, ack) => {
      console.log("send-chat-message-user:", { receiverId, message, senderId, businessId });
      try {
        if (!receiverId || !message || !senderId || !businessId) {
          ack.failure("Empty parameter");
          return;
        }

        const role = "User";
        const roleBusiness = "Business";
        const newCapitalizedMessage = CapitalizeFirstLetter(message);
        const receiver = getBusiness(receiverId, roleBusiness);
        const sender = getUser(senderId, role);

        const [checkNewSender, checkNewReceiver] = await Promise.all([
          User.findOne({ where: { id: senderId } }),
          User.findOne({ where: { id: receiverId } }),
        ]);

        if (!checkNewSender || !checkNewReceiver) {
          ack.failure("Sender or receiver not found");
          return;
        }

        let conversation = await Conversation.findOne({
          where: {
            businessId,
            [Op.or]: [
              { senderId: senderId, receiverId: receiverId },
              { senderId: receiverId, receiverId: senderId },
            ],
          },
          order: [["createdAt", "DESC"]],
        });

        let conversationId;
        if (conversation) {
          conversationId = conversation.id;
        } else {
          conversation = await Conversation.create({
            senderId,
            receiverId: receiverId,
            businessId,
            createdAt: Date.now(),
          });
          conversationId = conversation.id;
        }
        console.log("conversation ID is: ", conversationId);

        const newMessage = await Message.create({
          receiverId,
          senderId,
          message: newCapitalizedMessage,
          viewed: false,
          businessId,
          delivered: false,
          senderDelete: false,
          receiverDelete: false,
          createdAt: Date.now(),
          userType: "Business",
          conversationId,
        });
        console.log("This is the new message: ", newMessage);

        // Fetch conversation messages for real-time delivery
        const messages = await Message.findAll({
          where: {
            conversationId,
          },
          order: [["createdAt", "ASC"]],
        });

        // 1. Deliver real-time update to Receiver (Business)
        if (receiver) {
          const receiverSentMessages = messages.filter(
            (msg) => String(msg.senderId) === String(receiverId) && !msg.senderDelete
          );
          const receiverReceivedMessages = messages.filter(
            (msg) => String(msg.senderId) === String(senderId) && !msg.receiverDelete
          );

          io.to(receiver.socketId).emit("new-chat-messages-business", {
            data: {
              sent: receiverSentMessages,
              received: receiverReceivedMessages,
            },
          });

          // Fetch updated conversation list for the business
          const businessConversations = await Conversation.findAll({
            where: {
              businessId,
              [Op.or]: [{ senderId: receiverId }, { receiverId }],
            },
          });

          if (!businessConversations.length) {
            io.to(receiver.socketId).emit("new-lastest-messages-business", {
              data: [],
            });
          } else {
            const userIds = [
              ...new Set(
                businessConversations.map((convo) =>
                  String(convo.senderId) === String(receiverId)
                    ? convo.receiverId
                    : convo.senderId
                )
              ),
            ];

            const conversationIds = businessConversations.map((c) => c.id);
            const latestMessages = await Promise.all(
              conversationIds.map(async (cId) => {
                return Message.findOne({
                  where: { conversationId: cId },
                  order: [["createdAt", "DESC"]],
                });
              })
            );

            const results = await Promise.all(
              userIds.map(async (otherUserId) => {
                const convo = businessConversations.find(
                  (c) =>
                    String(c.senderId) === String(otherUserId) ||
                    String(c.receiverId) === String(otherUserId)
                );
                if (!convo) return null;

                const latestMessage = latestMessages.find(
                  (msg) => msg && String(msg.conversationId) === String(convo.id)
                );
                if (!latestMessage) return null;

                const unreadCount = await Message.count({
                  where: {
                    conversationId: convo.id,
                    senderId: otherUserId,
                    viewed: false,
                    receiverDelete: false,
                  },
                });

                const otherUser = await User.findOne({
                  where: { id: otherUserId },
                  attributes: ["id", "profileImage", "firstName", "lastName"],
                });
                if (!otherUser) return null;

                let profilePicture = otherUser.profileImage;
                let displayName = `${otherUser.firstName} ${otherUser.lastName}`;

                const business = await MsmeInformation.findOne({
                  where: { id: businessId, userId: otherUserId },
                });
                if (business) {
                  const businessLogoUser = await MsmeAdditionalInfo.findOne({
                    attributes: ["businessLogo"],
                    where: { businessId: business.id },
                  });
                  if (businessLogoUser) {
                    profilePicture = businessLogoUser.businessLogo;
                  }
                  displayName = business.businessDisplayName;
                }

                const conversationDetails = {
                  id: convo.id,
                  senderId: convo.senderId,
                  receiverId: convo.receiverId,
                  businessId: convo.businessId,
                  createdAt: convo.createdAt,
                  updatedAt: convo.updatedAt,
                };

                return {
                  userId: otherUser.id,
                  displayName,
                  profilePicture,
                  latestMessage,
                  conversationDetails,
                  unreadCount,
                };
              })
            );

            io.to(receiver.socketId).emit("new-lastest-messages-business", {
              data: results.filter(Boolean),
            });
          }
        }

        // Send Push Notification to Business Device Tokens
        try {
          const allUserDeviceTokens = await FcmToken.findAll({
            where: { userId: receiverId, role: "Business" },
            attributes: ["deviceToken"],
          });

          if (allUserDeviceTokens.length > 0) {
            await sendFcmToTokens(allUserDeviceTokens, {
              title: `${checkNewSender.firstName} ${checkNewSender.lastName}`,
              body: newCapitalizedMessage,
              data: {
                navigationId: "directMessageMsme",
                receiverId,
                senderId,
                businessId,
                conversationId,
              },
            });
          }
        } catch (fcmError) {
          console.error("FCM push error (send-chat-message-user):", fcmError.message);
        }

        // 2. Deliver real-time update to Sender (Customer)
        if (sender) {
          const senderSentMessages = messages.filter(
            (msg) => String(msg.senderId) === String(senderId) && !msg.senderDelete
          );
          const senderReceivedMessages = messages.filter(
            (msg) => String(msg.senderId) === String(receiverId) && !msg.receiverDelete
          );

          io.to(sender.socketId).emit("new-chat-messages-user", {
            data: {
              sent: senderSentMessages,
              received: senderReceivedMessages,
            },
          });
        }

        // 3. Update unread count badges for the receiver
        const senderCount = await getUnreadCountForSender({
          receiverId,
          senderId,
          conversationId,
        });
        const allCount = await getAllUnreadCount({ receiverId });
        const allBusinessCount = await getAllBusinessUnreadCount({
          receiverId,
          businessId,
        });

        if (receiver) {
          io.to(receiver.socketId).emit("count-updated", {
            receiverId,
            senderId,
            conversationId,
            businessId,
            count: senderCount,
            allCount,
            allBusinessCount,
          });
        }

        ack.success({ message: "Message processed successfully", data: newMessage });
      } catch (error) {
        sendErrorAlert(error, { source: "server.js" });
        console.error("Error in send-chat-message-user:", error);
        ack.failure("Something went wrong on our end. Please try again in a few moments.");
      }
    }
  );

  onSocketEvent(
    socket,
    "send-chat-message-business",
    async ({ receiverId, message, senderId, businessId } = {}, ack) => {
      console.log("send-chat-message-business:", { receiverId, message, senderId, businessId });
      try {
        if (!receiverId || !message || !senderId || !businessId) {
          ack.failure("Empty parameter");
          return;
        }

        const role = "User";
        const roleBusiness = "Business";
        const newCapitalizedMessage = CapitalizeFirstLetter(message);
        const receiver = getUser(senderId, role);
        const sender = getBusiness(receiverId, roleBusiness);

        const [checkBusiness, checkNewSender, checkNewReceiver] = await Promise.all([
          MsmeInformation.findOne({ where: { id: businessId } }),
          User.findOne({ where: { id: senderId } }),
          User.findOne({ where: { id: receiverId } }),
        ]);

        if (!checkNewSender || !checkNewReceiver || !checkBusiness) {
          ack.failure("Sender, receiver, or business not found");
          return;
        }

        let conversation = await Conversation.findOne({
          where: {
            businessId,
            [Op.or]: [
              { senderId: senderId, receiverId: receiverId },
              { senderId: receiverId, receiverId: senderId },
            ],
          },
          order: [["createdAt", "DESC"]],
        });

        let conversationId;
        if (conversation) {
          conversationId = conversation.id;
        } else {
          conversation = await Conversation.create({
            senderId: receiverId,
            receiverId: senderId,
            businessId,
            createdAt: Date.now(),
          });
          conversationId = conversation.id;
        }

        const newMessage = await Message.create({
          senderId: receiverId,
          receiverId: senderId,
          message: newCapitalizedMessage,
          viewed: false,
          businessId,
          delivered: false,
          senderDelete: false,
          receiverDelete: false,
          createdAt: Date.now(),
          userType: "User",
          conversationId,
        });

        // Fetch conversation messages once for real-time delivery
        const messages = await Message.findAll({
          where: {
            conversationId,
          },
          order: [["createdAt", "ASC"]],
        });

        // 1. Deliver real-time update to Customer (receiver)
        if (receiver) {
          io.to(receiver.socketId).emit("new-chat-messages", {
            data: "update",
          });

          const customerSentMessages = messages.filter(
            (msg) => String(msg.senderId) === String(senderId) && !msg.senderDelete
          );
          const customerReceivedMessages = messages.filter(
            (msg) => String(msg.senderId) === String(receiverId) && !msg.receiverDelete
          );

          io.to(receiver.socketId).emit("new-chat-messages-user", {
            data: {
              sent: customerSentMessages,
              received: customerReceivedMessages,
            },
          });

          // Fetch updated conversation list for the customer
          const userBusinesses = await MsmeInformation.findAll({
            where: { userId: senderId },
            attributes: ["id"],
          });
          const userBusinessIds = userBusinesses.map((b) => b.id);

          const customerConversations = await Conversation.findAll({
            where: {
              [Op.or]: [{ senderId }, { receiverId: senderId }],
            },
          });

          if (customerConversations.length > 0) {
            const conversationIds = customerConversations.map((convo) => convo.id);
            const latestMessages = await Promise.all(
              conversationIds.map(async (cId) => {
                return Message.findOne({
                  where: { conversationId: cId },
                  order: [["createdAt", "DESC"]],
                });
              })
            );

            const filteredConversations = customerConversations.filter(
              (convo) => !userBusinessIds.includes(convo.businessId)
            );

            const results = await Promise.all(
              filteredConversations.map(async (convo) => {
                const latestMessage = latestMessages.find(
                  (msg) => msg && String(msg.conversationId) === String(convo.id)
                );
                const otherUserId =
                  String(convo.senderId) === String(senderId)
                    ? convo.receiverId
                    : convo.senderId;

                const unreadCount = await Message.count({
                  where: {
                    conversationId: convo.id,
                    senderId: otherUserId,
                    viewed: false,
                    receiverDelete: false,
                  },
                });

                const otherUser = await User.findOne({
                  where: { id: otherUserId },
                  attributes: ["id", "profileImage", "firstName", "lastName"],
                });
                if (!otherUser) return null;

                let profilePicture = otherUser.profileImage;
                let displayName = `${otherUser.firstName} ${otherUser.lastName}`;

                const business = await MsmeInformation.findOne({
                  where: { id: convo.businessId, userId: otherUserId },
                });
                if (business) {
                  const businessLogoUser = await MsmeAdditionalInfo.findOne({
                    attributes: ["businessLogo"],
                    where: { businessId: business.id },
                  });
                  if (businessLogoUser) {
                    profilePicture = businessLogoUser.businessLogo;
                  }
                  displayName = business.businessDisplayName;
                }

                const conversationDetails = {
                  id: convo.id,
                  senderId: convo.senderId,
                  receiverId: convo.receiverId,
                  businessId: convo.businessId,
                  createdAt: convo.createdAt,
                };

                return {
                  businessId: convo.businessId,
                  displayName,
                  profilePicture,
                  latestMessage,
                  conversationDetails,
                  unreadCount,
                };
              })
            );

            io.to(receiver.socketId).emit("new-lastest-messages-user", {
              data: results.filter(Boolean),
            });
          }
        }

        // Send Push Notification to Customer Device Tokens
        try {
          const allUserDeviceTokens = await FcmToken.findAll({
            where: { userId: senderId, role: "User" },
            attributes: ["deviceToken"],
          });

          if (allUserDeviceTokens.length > 0) {
            await sendFcmToTokens(allUserDeviceTokens, {
              title: `${checkBusiness.businessDisplayName}`,
              body: newCapitalizedMessage,
              data: {
                navigationId: "directMessage",
                receiverId: senderId,
                senderId: receiverId,
                businessId,
                conversationId,
              },
            });
          }
        } catch (fcmError) {
          console.error("FCM push error (send-chat-message-business):", fcmError.message);
        }

        // 2. Deliver real-time update to Business (sender)
        if (sender) {
          io.to(sender.socketId).emit("new-chat-messages", {
            data: "update",
          });

          const businessSentMessages = messages.filter(
            (msg) => String(msg.senderId) === String(receiverId) && !msg.senderDelete
          );
          const businessReceivedMessages = messages.filter(
            (msg) => String(msg.senderId) === String(senderId) && !msg.receiverDelete
          );

          io.to(sender.socketId).emit("new-chat-messages-business", {
            data: {
              sent: businessSentMessages,
              received: businessReceivedMessages,
            },
          });
        }

        // 3. Update unread count badges for the customer
        const senderCount = await getUnreadCountForSender({
          receiverId: senderId,
          senderId: receiverId,
          conversationId,
        });
        const allCount = await getAllUnreadCount({ receiverId: senderId });
        const allBusinessCount = await getAllBusinessUnreadCount({
          receiverId: senderId,
          businessId,
        });

        if (receiver) {
          io.to(receiver.socketId).emit("count-updated", {
            receiverId: senderId,
            senderId: receiverId,
            conversationId,
            businessId,
            count: senderCount,
            allCount,
            allBusinessCount,
          });
        }

        ack.success({ message: "Message processed successfully", data: newMessage });
      } catch (error) {
        sendErrorAlert(error, { source: "server.js" });
        console.error("Error in send-chat-message-business:", error);
        ack.failure("Something went wrong on our end. Please try again in a few moments.");
      }
    }
  );

  onSocketEvent(socket, "getSingleConversation", async (data, ack) => {
    try {
      const { senderId, businessId, conversationId, id } = data || {};

      const currentUserId = id || senderId;
      if (!currentUserId || !conversationId) {
        ack.failure("Empty parameter");
        return;
      }

      const conversationRecord = await Conversation.findOne({
        where: { id: conversationId },
      });

      if (!conversationRecord) {
        ack.failure("Conversation not found");
        return;
      }

      const otherUserId =
        String(conversationRecord.senderId) === String(currentUserId)
          ? conversationRecord.receiverId
          : conversationRecord.senderId;

      const messages = await Message.findAll({
        where: {
          conversationId,
          [Op.or]: [
            { senderId: currentUserId, senderDelete: false },
            { receiverId: currentUserId, receiverDelete: false },
          ],
        },
        order: [["createdAt", "ASC"]],
      });

      const sentMessages = messages.filter(
        (msg) => String(msg.senderId) === String(currentUserId)
      );
      const receivedMessages = messages.filter(
        (msg) => String(msg.receiverId) === String(currentUserId)
      );

      const conversation = {
        otherUserId,
        conversationDetails: conversationRecord,
        sent: sentMessages,
        received: receivedMessages,
      };

      ack.success({
        message: "Messages successfully retrieved!",
        data: conversation,
      });
    } catch (error) {
      sendErrorAlert(error, { source: "server.js" });
      console.error("Error in getSingleConversation:", error);
      ack.failure("Something went wrong on our end. Please try again in a few moments.");
    }
  });

  socket.on(
    "sendToAllAdmin",
    async ({ notification, type, priority, senderId }) => {
      try {
        let role = "Admin";
        const newCapitalizedNotification = CapitalizeFirstLetter(notification);
        if (notification && type && priority && senderId) {
          const checkNewUserExist = await User.findOne({
            where: { id: senderId },
          });

          if (!checkNewUserExist) {
            console.error("No account matches the provided details.");
            return;
          }
          const users = await Admin.findAll({
            attributes: ["id"],
          });

          if (users.length === 0) {
            console.error("No admins found.");
            return;
          }

          const notifications = users.map((user) => ({
            userId: user.id,
            notification: newCapitalizedNotification,
            senderId,
            type,
            priority,
            createdAt: Date.now(),
            viewed: false,
          }));

          await AdminNotification.bulkCreate(notifications);

          for (const user of users) {
            const adminNotifications = await AdminNotification.findAll({
              where: {
                userId: user.id,
                viewed: false,
              },
            });

            const adminNotificationCount = await AdminNotification.count({
              where: {
                userId: user.id,
                viewed: false,
              },
            });

            const adminSocket = getUser(user.id, role);
            if (adminSocket) {
              io.to(adminSocket.socketId).emit("receiveFromAllNotification", {
                notifications: adminNotifications,
                notificationCount: adminNotificationCount,
              });
            }
          }
        }
      } catch (error) {
    sendErrorAlert(error, { source: "server.js" });
        console.error("Error sending notifications:", error);
      }
    }
  );

  socket.on("disconnect", () => {
    removeUser(socket.id);
    removeBusiness(socket.id);
    console.log("A user disconnected");
  });
});

sequelize
  .sync()
  .then(() => {
    console.log("Database connected");
    const PORT = process.env.PORT;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    sendErrorAlert(error, { source: "server.js" });
    console.error("Error synchronizing database:", error);
  });


