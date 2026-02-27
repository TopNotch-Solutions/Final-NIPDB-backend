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
const adminFirebase = require("./config/firebaseConfig");
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
const userAdminRouter = require("./routes/adminRoutes/userRoute");
const Admin = require("./models/admin");
const NotificationHistory = require("./models/notificationHistory");
const { where } = require("sequelize");
const CapitalizeFirstLetter = require("./utils/shared/capitalizeFirstLetter");
const { title } = require("process");
const FcmToken = require("./models/fcmToken");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://41.219.71.112:8080"],
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
app.options('*', cors());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://41.219.71.112:8080", "https://dt.mtc.com.na:4000"],
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
  console.log(id, role, socketId);
  if (!onlineUsers.some((user) => user.id === id && user.role === role)) {
    onlineUsers.push({ id, role, socketId });
  }
};

const addNewBusinesss = (id, role, socketId) => {
  console.log(id, role, socketId);
  if (!onlineBusiness.some((user) => user.id === id && user.role === role)) {
    onlineBusiness.push({ id, role, socketId });
  }
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};
const removeBusiness = (socketId) => {
  onlineBusiness = onlineBusiness.filter((user) => user.socketId !== socketId);
};

const getUser = (id, role) => {
  return onlineUsers.find((user) => user.id === id && user.role === role);
};

const getBusiness = (id, role) => {
  return onlineBusiness.find((user) => user.id === id && user.role === role);
};

const getAllOnlineUsers = () => {
  return onlineUsers.map((user) => ({ id: user.id, role: user.role }));
};

const getAllOnlineBusiness = () => {
  return onlineBusiness.map((user) => ({ id: user.id, role: user.role }));
};

const removeUserByRole = (id, role) => {
  onlineUsers = onlineUsers.filter(
    (user) => !(user.id === id && user.role === role)
  );
};

const removeBusinessByRole = (id, role) => {
  onlineBusiness = onlineBusiness.filter(
    (user) => !(user.id === id && user.role === role)
  );
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
        console.error("Error sending notifications:", error);
      }
    }
  );
  // message is still a notification.
  socket.on(
    "send-chat-message-user",
    async ({ receiverId, message, senderId, businessId }) => {
      console.log(receiverId, message, senderId, businessId);
      try {
        let role = "User";
        let roleBusiness = "Business";
        const newCapitalizedMessage = CapitalizeFirstLetter(message);
        const receiver = getBusiness(receiverId, roleBusiness);
        const sender = getUser(senderId, role);

        if (receiverId && message && senderId && businessId) {
          console.log("both user present");
          const checkNewSender = await User.findOne({
            where: { id: senderId },
          });
          const checkNewReciever = await User.findOne({
            where: { id: receiverId },
          });
          console.log(checkNewReciever, checkNewSender);

          if (checkNewSender && checkNewReciever) {
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
              const newConversation = await Conversation.create({
                senderId,
                receiverId: receiverId,
                businessId,
                createdAt: Date.now(),
              });
              conversationId = newConversation.id;
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

            if (newMessage) {
              // Send Socket Update
              if (receiver) {
                const conversation = await Conversation.findOne({
                  where: {
                    businessId,
                    senderId,
                    receiverId,
                  },
                });

                if (!conversation) {
                  const conversationDataNon = {
                    sent: [],
                    received: [],
                  };
                  io.to(receiver.socketId).emit("new-chat-messages-business", {
                    data: conversationDataNon,
                  });
                  return;
                }

                const messages = await Message.findAll({
                  where: {
                    conversationId: conversation.id,
                    [Op.or]: [{ senderId: senderId }, { senderId: receiverId }],
                    receiverDelete: false,
                  },
                  order: [["createdAt", "ASC"]],
                });
                const sentMessages = messages.filter(
                  (msg) => msg.senderId === senderId
                );
                const receivedMessages = messages.filter(
                  (msg) => msg.senderId === receiverId
                );

                const conversationData = {
                  sent: sentMessages,
                  received: receivedMessages,
                };
                io.to(receiver.socketId).emit("new-chat-messages-business", {
                  data: conversationData,
                });
                const conversations = await Conversation.findAll({
                  where: {
                    businessId,
                    [Op.or]: [{ senderId: receiverId }, { receiverId }],
                  },
                });
                if (!conversations.length) {
                  return res.status(200).json({
                    status: "SUCCESS",
                    message: "No conversations found",
                    data: [],
                  });
                }
                const userIds = [
                  ...new Set(
                    conversations.map((convo) =>
                      convo.senderId === receiverId
                        ? convo.receiverId
                        : convo.senderId
                    )
                  ),
                ];
                const latestMessages = await Promise.all(
                  conversations.map(async (conversation) => {
                    return Message.findOne({
                      where: { conversationId: conversation.id },
                      order: [["createdAt", "DESC"]],
                    });
                  })
                );
                const results = await Promise.all(
                  userIds.map(async (otherUserId) => {
                    const conversation = conversations.find(
                      (convo) =>
                        convo.senderId === otherUserId ||
                        convo.receiverId === otherUserId
                    );
                    if (!conversation) return null;
                    const latestMessage = latestMessages.find(
                      (msg) => msg.conversationId === conversation.id
                    );

                    if (!latestMessage) {
                      throw new Error("Latest message not found");
                    }
                    const unreadCount = await Message.count({
                      where: {
                        conversationId: conversation.id,
                        senderId: otherUserId,
                        viewed: false,
                        receiverDelete: false,
                      },
                    });

                    const otherUser = await User.findOne({
                      where: { id: otherUserId },
                      attributes: [
                        "id",
                        "profileImage",
                        "firstName",
                        "lastName",
                      ],
                    });

                    if (!otherUser) {
                      throw new Error("Other user not found");
                    }

                    let profilePicture = otherUser.profileImage;
                    let displayName = `${otherUser.firstName} ${otherUser.lastName}`;

                    const business = await MsmeInformation.findOne({
                      where: { id: businessId, userId: otherUserId },
                    });
                    if (business) {
                      const businessLogoUser = await MsmeAdditionalInfo.findOne(
                        {
                          attributes: ["businessLogo"],
                          where: { businessId: business.id },
                        }
                      );
                      if (businessLogoUser) {
                        profilePicture = businessLogoUser.businessLogo;
                      }
                      displayName = business.businessDisplayName;
                    }

                    const conversationDetails = {
                      id: conversation.id,
                      senderId: conversation.senderId,
                      receiverId: conversation.receiverId,
                      businessId: conversation.businessId,
                      createdAt: conversation.createdAt,
                      updatedAt: conversation.updatedAt,
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
                console.log("Results", results);
                const allUserDeviceTokens = await FcmToken.findAll({
                  where: { userId: receiverId, role: "Business" },
                  attributes: ["deviceToken"],
                });

                if (allUserDeviceTokens.length > 0) {
                  const message = {
                    notification: {
                      title: `${checkNewSender.firstName} ${checkNewSender.lastName}`,
                      body: newCapitalizedMessage,
                    },
                    data: {
                      title: `${checkNewSender.firstName} ${checkNewSender.lastName}`,
                      body: newCapitalizedMessage,
                      navigationId: "directMessageMsme",
                      receiverId: String(receiverId),
                      senderId: String(senderId),
                      businessId: String(businessId),
                      conversationId: String(conversationId)
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
                  };

                  const firebasePromises = allUserDeviceTokens.map(
                    async ({ deviceToken }) => {
                      try {
                        return await adminFirebase
                          .messaging()
                          .send({ ...message, token: deviceToken })
                          .then({});
                      } catch (firebaseError) {
                        console.error("Firebase error:", firebaseError);

                        if (
                          firebaseError.code ===
                          "messaging/registration-token-not-registered"
                        ) {
                          await FcmToken.destroy({
                            where: { deviceToken },
                          });
                          console.log(
                            `Removed unregistered device token: ${deviceToken}`
                          );
                        } else {
                          throw firebaseError;
                        }
                      }
                    }
                  );

                  await Promise.all(firebasePromises);
                }
                io.to(receiver.socketId).emit("new-lastest-messages-business", {
                  data: results.filter((result) => result !== null),
                });
              } else {
                const allUserDeviceTokens = await FcmToken.findAll({
                  where: { userId: receiverId, role: "Business" },
                  attributes: ["deviceToken"],
                });

                if (allUserDeviceTokens.length > 0) {
                  const message = {
                    notification: {
                      title: `${checkNewSender.firstName} ${checkNewSender.lastName}`,
                      body: newCapitalizedMessage,
                    },
                    data: {
                      title: `${checkNewSender.firstName} ${checkNewSender.lastName}`,
                      body: newCapitalizedMessage,
                      navigationId: "directMessageMsme",
                      receiverId: String(receiverId),
                      senderId: String(senderId),
                      businessId: String(businessId),
                      conversationId: String(conversationId)
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
                  };

                  const firebasePromises = allUserDeviceTokens.map(
                    async ({ deviceToken }) => {
                      try {
                        return await adminFirebase
                          .messaging()
                          .send({ ...message, token: deviceToken })
                          .then({});
                      } catch (firebaseError) {
                        console.error("Firebase error:", firebaseError);

                        if (
                          firebaseError.code ===
                          "messaging/registration-token-not-registered"
                        ) {
                          await FcmToken.destroy({
                            where: { deviceToken },
                          });
                          console.log(
                            `Removed unregistered device token: ${deviceToken}`
                          );
                        } else {
                          throw firebaseError;
                        }
                      }
                    }
                  );

                  await Promise.all(firebasePromises);
                }
              }

              // Send Socket Update for Sender
              if (sender) {
                const conversation = await Conversation.findOne({
                  where: {
                    businessId,
                    senderId,
                    receiverId,
                  },
                });

                if (!conversation) {
                  const conversationDataNon = {
                    sent: [],
                    received: [],
                  };
                  io.to(sender.socketId).emit("new-chat-messages-user", {
                    data: conversationDataNon,
                  });
                  return;
                }

                const messages = await Message.findAll({
                  where: {
                    conversationId: conversation.id,
                    [Op.or]: [{ senderId }, { senderId: receiverId }],
                    receiverDelete: false,
                  },
                  order: [["createdAt", "ASC"]],
                });
                const sentMessages = messages.filter(
                  (msg) => msg.senderId === senderId
                );
                const receivedMessages = messages.filter(
                  (msg) => msg.senderId === receiverId
                );

                const conversationData = {
                  sent: sentMessages,
                  received: receivedMessages,
                };
                io.to(sender.socketId).emit("new-chat-messages-user", {
                  data: conversationData,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    }
  );

  socket.on(
    "send-chat-message-business",
    async ({ receiverId, message, senderId, businessId }) => {
      console.log(receiverId, message, senderId, businessId);
      try {
        let role = "User";
        let roleBusiness = "Business";
        const newCapitalizedMessage = CapitalizeFirstLetter(message);
        const receiver = getUser(senderId, role);
        const sender = getBusiness(receiverId, roleBusiness);

        if (receiverId && message && senderId && businessId) {
          const checkBusiness =  await MsmeInformation.findOne({
            where:{id: businessId}
          });
          const checkNewSender = await User.findOne({
            where: { id: senderId },
          });
          const checkNewReceiver = await User.findOne({
            where: { id: receiverId },
          });

          if (checkNewSender && checkNewReceiver && checkBusiness) {
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
              const newConversation = await Conversation.create({
                senderId: receiverId,
                receiverId: senderId,
                businessId,
                createdAt: Date.now(),
              });
              conversationId = newConversation.id;
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

            if (newMessage) {
              
              if(receiver){
                io.to(receiver.socketId).emit("new-chat-messages", {
                  data: "update",
                });
              }

              if(sender){
                io.to(sender.socketId).emit("new-chat-messages", {
                  data: "update",
                });
              }

              if (receiver) {
                const conversation = await Conversation.findOne({
                  where: { businessId, senderId, receiverId },
                });

                if (!conversation) {
                  return;
                }

                const messages = await Message.findAll({
                  where: {
                    conversationId: conversation.id,
                    [Op.or]: [{ senderId: senderId }, { senderId: receiverId }],
                    receiverDelete: false,
                  },
                  order: [["createdAt", "ASC"]],
                });

                const sentMessages = messages.filter(
                  (msg) => msg.senderId === senderId
                );

                const receivedMessages = messages.filter(
                  (msg) => msg.senderId === receiverId
                );

                const conversationData = {
                  sent: sentMessages,
                  received: receivedMessages,
                };

                io.to(receiver.socketId).emit("new-chat-messages-user", {
                  data: conversationData,
                });

                const userBusinesses = await MsmeInformation.findAll({
                  where: { userId: receiverId },
                  attributes: ["id"],
                });

                const userBusinessIds = userBusinesses.map(
                  (business) => business.id
                );

                const conversations = await Conversation.findAll({
                  where: {
                    [Op.or]: [{ senderId: receiverId }, { receiverId }],
                  },
                });

                if (!conversations.length) return;

                const conversationIds = conversations.map((convo) => convo.id);

                const latestMessages = await Promise.all(
                  conversationIds.map(async (conversationId) => {
                    return Message.findOne({
                      where: { conversationId },
                      order: [["createdAt", "DESC"]],
                    });
                  })
                );

                const filteredConversations = conversations.filter(
                  (convo) => !userBusinessIds.includes(convo.businessId)
                );

                const results = await Promise.all(
                  filteredConversations.map(async (convo) => {
                    const latestMessage = latestMessages.find(
                      (msg) => msg.conversationId === convo.id
                    );
                    const otherUserId =
                      convo.senderId === receiverId
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
                      attributes: [
                        "id",
                        "profileImage",
                        "firstName",
                        "lastName",
                      ],
                    });

                    if (!otherUser) {
                      throw new Error("Other user not found");
                    }
                    let profilePicture = otherUser.profileImage;
                    let displayName = `${otherUser.firstName} ${otherUser.lastName}`;

                    const business = await MsmeInformation.findOne({
                      where: { id: convo.businessId, userId: otherUserId },
                    });
                    if (business) {
                      const businessLogoUser = await MsmeAdditionalInfo.findOne(
                        {
                          attributes: ["businessLogo"],
                          where: { businessId: business.id },
                        }
                      );
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
                const allUserDeviceTokens = await FcmToken.findAll({
                  where: { userId: receiverId, role: "User" },
                  attributes: ["deviceToken"],
                });

                if (allUserDeviceTokens.length > 0) {
                  const message = {
                    notification: {
                      title: `${checkBusiness.businessDisplayName}`,
                      body: newCapitalizedMessage,
                    },
                    data: {
                      title: `${checkBusiness.businessDisplayName}`,
                      body: newCapitalizedMessage,
                      navigationId: "directMessage",
                      receiverId: String(receiverId),
                      senderId: String(senderId),
                      businessId: String(businessId),
                      conversationId: String(conversationId),
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
                  };

                  const firebasePromises = allUserDeviceTokens.map(
                    async ({ deviceToken }) => {
                      try {
                        return await adminFirebase
                          .messaging()
                          .send({ ...message, token: deviceToken });
                      } catch (firebaseError) {
                        console.error("Firebase error:", firebaseError);

                        if (
                          firebaseError.code ===
                          "messaging/registration-token-not-registered"
                        ) {
                          await FcmToken.destroy({
                            where: { deviceToken },
                          });
                          console.log(
                            `Removed unregistered device token: ${deviceToken}`
                          );
                        } else {
                          throw firebaseError;
                        }
                      }
                    }
                  );

                  await Promise.all(firebasePromises);
                }
                io.to(receiver.socketId).emit("new-lastest-messages-user", {
                  data: results,
                });
              } else {
                const allUserDeviceTokens = await FcmToken.findAll({
                  where: { userId: senderId, role: "User" },
                  attributes: ["deviceToken"],
                });

                if (allUserDeviceTokens.length > 0) {
                  const message = {
                    notification: {
                      title: `${checkBusiness.businessDisplayName}`,
                      body: newCapitalizedMessage,
                    },
                    data: {
                      title: `${checkBusiness.businessDisplayName}`,
                      body: newCapitalizedMessage,
                      navigationId: "directMessage",
                      receiverId: String(senderId),
                      senderId: String(receiverId),
                      businessId: String(businessId),
                      conversationId: String(conversationId),
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
                  };

                  const firebasePromises = allUserDeviceTokens.map(
                    async ({ deviceToken }) => {
                      try {
                        return await adminFirebase
                          .messaging()
                          .send({ ...message, token: deviceToken });
                      } catch (firebaseError) {
                        console.error("Firebase error:", firebaseError);

                        if (
                          firebaseError.code ===
                          "messaging/registration-token-not-registered"
                        ) {
                          await FcmToken.destroy({
                            where: { deviceToken },
                          });
                          console.log(
                            `Removed unregistered device token: ${deviceToken}`
                          );
                        } else {
                          throw firebaseError;
                        }
                      }
                    }
                  );

                  await Promise.all(firebasePromises);
                }
              }

              if (sender) {
                const conversation = await Conversation.findOne({
                  where: { businessId, senderId, receiverId },
                });

                if (!conversation) return;

                const messages = await Message.findAll({
                  where: {
                    conversationId: conversation.id,
                    [Op.or]: [{ senderId }, { senderId: receiverId }],
                    receiverDelete: false,
                  },
                  order: [["createdAt", "ASC"]],
                });

                const sentMessages = messages.filter(
                  (msg) => msg.senderId === senderId
                );
                const receivedMessages = messages.filter(
                  (msg) => msg.senderId === receiverId
                );

                const conversationData = {
                  sent: sentMessages,
                  received: receivedMessages,
                };

                io.to(sender.socketId).emit("new-chat-messages-business", {
                  data: conversationData,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    }
  );

  socket.on("getSingleConversation", async (data, callback) => {
    try {
      const { senderId, businessId, conversationId, id } = data;

      if (!senderId || !id || !businessId || !conversationId) {
        return callback({
          status: "FAILURE",
          message: "Empty parameter",
        });
      }

      let recieverId;

      if (senderId === id) {
        const otherUser = await Message.findOne({
          where: {
            businessId,
            conversationId,
            [Op.or]: [
              { senderId: { [Op.ne]: id } },
              { recieverId: { [Op.ne]: id } },
            ],
          },
        });

        if (!otherUser) {
          return callback({
            status: "FAILURE",
            message: "Other user not found",
          });
        }

        recieverId =
          otherUser.senderId === id ? otherUser.recieverId : otherUser.senderId;
      } else {
        recieverId = id;
      }

      const messages = await Message.findAll({
        where: {
          businessId,
          conversationId,
          [Op.or]: [
            {
              senderId,
              recieverId: recieverId,
            },
            {
              senderId: recieverId,
              recieverId: senderId,
            },
          ],
          recieverDelete: false,
        },
        order: [["createdAt", "DESC"]],
      });

      const sentMessages = messages.filter((msg) => msg.senderId === senderId);
      const receivedMessages = messages.filter(
        (msg) => msg.senderId === recieverId
      );

      const conversation = {
        otherUserId: recieverId,
        sent: sentMessages,
        received: receivedMessages,
      };

      callback({
        status: "SUCCESS",
        message: "Messages successfully retrieved!",
        data: conversation,
      });
    } catch (error) {
      callback({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
      });
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
            console.error("User not found.");
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
    console.error("Error synchronizing database:", error);
  });


