const { where, Op, Sequelize } = require("sequelize");
const Message = require("../../models/directMessage");
const User = require("../../models/user");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");

const sequelize = require("../../config/dbConfig");
const MsmeInformation = require("../../models/msmeInformation");
const MsmeAdditionalInfo = require("../../models/msmeAdditionalInfo");
const Conversation = require("../../models/conversation");

exports.create = async (req, res) => {
  try {
    let {id} = req.user;
    let { receiverId, message, businessId } = req.body;

    if (!id || !receiverId || !message || !businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty input fields",
      });
    }
    if (receiverId === id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Sending messages to yourself is not allowed!",
      });
    }
    message = CapitalizeFirstLetter(message);

    const checkSender = await User.findOne({
      where: {
        id,
      },
    });

    if (!checkSender) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Sender user does not exist",
      });
    }

    const checkReceiver = await User.findOne({
      where: {
        id: receiverId,
      },
    });

    if (!checkReceiver) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Receiver user does not exist",
      });
    }

    // Check for an existing conversation
    let conversation = await Conversation.findOne({
      where: {
        businessId,
        [Op.or]: [
          { senderId: id, receiverId: receiverId },
          { senderId: receiverId, receiverId: id }
        ]
      },
      order: [['createdAt', 'DESC']] 
    });

    let conversationId;

    if (conversation) {
      conversationId = conversation.id;
    } else {
      const newConversation = await Conversation.create({
        senderId: id,
        receiverId: receiverId,
        businessId,
        createdAt: Date.now(),
      });
      conversationId = newConversation.id;
    }

    const newMessage = await Message.create({
      receiverId,
      senderId: id,
      message,
      viewed: false,
      businessId,
      delivered: false,
      senderDelete: false,
      receiverDelete: false,
      createdAt: Date.now(),
      conversationId
    });

    if (newMessage) {
      if (checkReceiver.fcmToken) {
        const pushNotification = {
          notification: {
            title: "Message notification",
            body: `${newMessage.message}`,
          },
          token: checkReceiver.fcmToken,
        };

        try {
          await firebaseAdmin.messaging().send(pushNotification);
          return res.status(201).json({
            status: "SUCCESS",
            message: "Message successfully sent!",
          });
        } catch (error) {
          console.error("Error sending push notification:", error);
          return res.status(500).json({
            status: "FAILURE",
            message: "Internal server error. Unable to send push notification",
          });
        }
      }

      return res.status(201).json({
        status: "SUCCESS",
        message: "Message successfully sent!",
      });
    } else {
      return res.status(500).json({
        status: "FAILURE",
        message: "Internal server error. Something went wrong during the insertion of data into the database",
      });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};


// exports.generalUser = async (req, res) => {
//   try {
//     const id = req.body.id;
//     if (!id) {
//       return res.status(400).json({ status: "FAILURE", message: "Empty input fields" });
//     }

//     const userBusinesses = await MsmeInformation.findAll({
//       where: { userId: id },
//       attributes: ['id']
//     });

//     const userBusinessIds = userBusinesses.map(business => business.id);

//     const results = await sequelize.query(
//       `SELECT DISTINCT businessId FROM messages WHERE senderId = :id OR recieverId = :id`,
//       { replacements: { id }, type: sequelize.QueryTypes.SELECT }
//     );

//     if (!Array.isArray(results)) {
//       throw new Error("Unexpected results format from query");
//     }

//     const businessIds = results.map((row) => row.businessId);

//     const filteredBusinessIds = businessIds.filter(businessId => !userBusinessIds.includes(businessId));

//     const conversations = await Promise.all(
//       filteredBusinessIds.map(async (businessId) => {
//         const latestMessage = await Message.findOne({
//           where: {
//             businessId,
//             [Op.or]: [
//               { senderId: id, senderDelete: false },
//               { recieverId: id, recieverDelete: false },
//             ],
//           },
//           order: [["createdAt", "DESC"]],
//         });

//         if (!latestMessage) {
//           throw new Error("Latest message not found");
//         }

//         const otherUserId = latestMessage.senderId === id ? latestMessage.recieverId : latestMessage.senderId;

//         const unreadCount = await Message.count({
//           where: {
//             recieverId: id,
//             senderId: otherUserId,
//             viewed: false,
//             businessId,
//             recieverDelete: false
//           },
//         });

//         const otherUser = await User.findOne({
//           where: { id: otherUserId },
//           attributes: ["id", "profileImage", "firstName", "lastName"],
//         });

//         if (!otherUser) {
//           throw new Error("Other user not found");
//         }

//         let profilePicture = otherUser.profileImage;
//         let displayName = `${otherUser.firstName} ${otherUser.lastName}`;

//         const business = await MsmeInformation.findOne({
//           where: { id: businessId, userId: otherUserId },
//         });

//         if (business) {
//           const businessLogoUser = await MsmeAdditionalInfo.findOne({
//             attributes: ["businessLogo"],
//             where: { businessId: business.id },
//           });
//           if (businessLogoUser) {
//             profilePicture = businessLogoUser.businessLogo;
//           }
//           displayName = business.businessDisplayName;
//         }

//         return {
//           businessId,
//           displayName,
//           profilePicture,
//           latestMessage,
//           unreadCount,
//         };
//       })
//     );

//     res.status(200).json({
//       status: "SUCCESS",
//       message: "Conversations successfully retrieved!",
//       data: conversations,
//     });
//   } catch (error) {
//     console.error("Error retrieving conversations:", error);
//     res.status(500).json({
//       status: "FAILURE",
//       message: "Internal server error: " + error.message,
//     });
//   }
// };

exports.generalUser = async (req, res) => {
  try {
    const id = req.user.id;
    if (!id) {
      return res.status(400).json({ status: "FAILURE", message: "Empty input fields" });
    }

    const userBusinesses = await MsmeInformation.findAll({
      where: { userId: id },
      attributes: ['id']
    });
    console.log("User id is: ",id)
    const userBusinessIds = userBusinesses.map(business => business.id);
    console.log("user business ids: ",userBusinessIds)
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { senderId: id}, 
          { receiverId: id },
        ]
      }
    });
console.log("this are my conversations: ",conversations);
    if (!conversations.length) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No conversations found",
        data: []
      });
    }

    const conversationIds = conversations.map(convo => convo.id);

    // Fetch latest messages for each conversation
    const latestMessages = await Promise.all(conversationIds.map(async (conversationId) => {
      return Message.findOne({
        where: {
          conversationId,
          [Op.or]: [
            { senderId: id, senderDelete: false },
            { receiverId: id, receiverDelete: false }
          ]
        },
        order: [['createdAt', 'DESC']]
      });
    }));
    
    console.log("This are my latest messages: ",latestMessages)
    // Filter out conversations related to user's businesses
    const filteredConversations = conversations.filter(convo => !userBusinessIds.includes(convo.businessId));

    // Construct results with additional checks for null values
    const results = await Promise.all(filteredConversations.map(async (convo) => {
      const latestMessage = latestMessages.find(msg => msg && msg.conversationId === convo.id); // Check if latestMessage exists
      const otherUserId = convo.senderId === id ? convo.receiverId : convo.senderId;

      // Count unread messages for the current conversation
      const unreadCount = await Message.count({
        where: {
          conversationId: convo.id,
          senderId: otherUserId,
          viewed: false,
          receiverDelete: false
        }
      });

      const otherUser = await User.findOne({
        where: { id: otherUserId },
        attributes: ["id", "profileImage", "firstName", "lastName"]
      });

      if (!otherUser) {
        throw new Error("Other user not found");
      }

      let profilePicture = otherUser.profileImage;
      let displayName = `${otherUser.firstName} ${otherUser.lastName}`;

      const business = await MsmeInformation.findOne({
        where: { id: convo.businessId, userId: otherUserId }
      });

      if (business) {
        const businessLogoUser = await MsmeAdditionalInfo.findOne({
          attributes: ["businessLogo"],
          where: { businessId: business.id }
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
        latestMessage: latestMessage || null,  // Handle cases where no message is found
        conversationDetails,
        unreadCount,
      };
    }));
    console.log("This is the result: ",results)
    res.status(200).json({
      status: "SUCCESS",
      message: "Conversations successfully retrieved!",
      data: results
    });
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message
    });
  }
};




exports.businessUser = async (req, res) => {
  try {
    const id = req.user.id;
    const { currentBusinessId } = req.params;

    if (!id || !currentBusinessId) {
      return res.status(400).json({ status: "FAILURE", message: "Empty input fields" });
    }

    const conversations = await Conversation.findAll({
      where: {
        businessId: currentBusinessId,
        [Op.or]: [
          // { senderId: id },
          // { receiverId: id}
          { senderId: id },
          { receiverId: id }
        ]
      }
    });

    if (!conversations.length) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No conversations found",
        data: []
      });
    }

    const userIds = [...new Set(
      conversations.map(convo => convo.senderId === id ? convo.receiverId : convo.senderId)
    )];

    const latestMessages = await Promise.all(
      conversations.map(async (conversation) => {
        return Message.findOne({
          where: {
             conversationId: conversation.id ,
             [Op.or]: [
              { senderId: id, senderDelete: false },
              { receiverId: id, receiverDelete: false }
            ]
            },
          order: [['createdAt', 'DESC']]
        });
      })
    );

    const results = await Promise.all(userIds.map(async (otherUserId) => {
      const conversation = conversations.find(convo => convo.senderId === otherUserId || convo.receiverId === otherUserId);
      if (!conversation) return null;

      const latestMessage = latestMessages.find(msg => msg.conversationId === conversation.id);

      if (!latestMessage) {
        throw new Error("Latest message not found");
      }

      const unreadCount = await Message.count({
        where: {
          conversationId: conversation.id,
          senderId: otherUserId,
          viewed: false,
          receiverDelete: false
        }
      });

      const otherUser = await User.findOne({
        where: { id: otherUserId },
        attributes: ["id", "profileImage", "firstName", "lastName"],
      });

      if (!otherUser) {
        throw new Error("Other user not found");
      }

      let profilePicture = otherUser.profileImage;
      let displayName = `${otherUser.firstName} ${otherUser.lastName}`;

      const business = await MsmeInformation.findOne({
        where: { id: currentBusinessId, userId: otherUserId },
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
        id: conversation.id,
        senderId: conversation.senderId,
        receiverId: conversation.receiverId,
        businessId: conversation.businessId,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };

      return {
        userId: otherUser.id,
        displayName,
        profilePicture,
        latestMessage,
        conversationDetails,
        unreadCount,
      };
    }));

    res.status(200).json({
      status: "SUCCESS",
      message: "Conversations successfully retrieved!",
      data: results.filter(result => result !== null),  
    });
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};


exports.singleUser = async (req, res) => {
  try {
    const { businessId, receiverId } = req.body; 
    let { id } = req.user;

    if (!id || !businessId || !receiverId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Missing parameter",
      });
    }

    const conversation = await Conversation.findOne({
      where: {
        businessId,
        senderId: id,
        receiverId,
      },
    });

    if (!conversation) {
      const conversationDataNon = {
        sent: [],
        received: []
      };
      return res.status(404).json({
        status: "FAILURE",
        message: "Conversation not found",
        data: conversationDataNon
      });
    }

    const messages = await Message.findAll({
      where: {
        conversationId: conversation.id,
        [Op.or]: [
          { 
            senderId: id, 
            senderDelete: false 
          },
          { 
            receiverId: id, 
            receiverDelete: false 
          },
        ]
      },
      order: [["createdAt", "ASC"]],
    });

    const sentMessages = messages.filter((msg) => msg.senderId === id && !msg.senderDelete);
    const receivedMessages = messages.filter((msg) => msg.receiverId === id && !msg.receiverDelete);

    const conversationData = {
      sent: sentMessages,
      received: receivedMessages,
    };

    res.status(200).json({
      status: "SUCCESS",
      message: "Messages successfully retrieved!",
      data: conversationData,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};


exports.singleChatBusiness = async (req, res) => {
  try {
    const { businessId, receiverId } = req.body; 
    let { id } = req.user;

    if (!id || !businessId || !receiverId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Missing parameter",
      });
    }
    console.log(businessId,receiverId,id)
    const conversation = await Conversation.findOne({
      where: {
        businessId,
        senderId:receiverId,
        receiverId:id,
      },
    });

    if (!conversation) {
      const conversationDatanNon = {
        sent:[],
        received:[]
      }
      return res.status(404).json({
        status: "FAILURE",
        message: "Conversation not found",
        data: conversationDatanNon
      });
    }

    const messages = await Message.findAll({
      where: {
        conversationId: conversation.id,
        [Op.or]: [
          { 
            senderId: id, 
            senderDelete: false 
          },
          { 
            receiverId: id, 
            receiverDelete: false 
          },
        ],
        // receiverDelete: false,
      },
      order: [["createdAt", "ASC"]],
    });
    console.log(messages)

    const sentMessages = messages.filter((msg) => msg.senderId === id && !msg.senderDelete);
    const receivedMessages = messages.filter((msg) => msg.receiverId === id && !msg.receiverDelete);
    // console.log('THis are your sent messages',sentMessages)
    // console.log('received messages',receivedMessages)
    const conversationData = {
      sent: sentMessages,
      received: receivedMessages,
    };

    res.status(200).json({
      status: "SUCCESS",
      message: "Messages successfully retrieved!",
      data: conversationData,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};


exports.singleBusiness = async (req, res) => {
  try {
    const { businessId, conversationId } = req.body;
    let {id} = req.user;// id is the current user ID

    if (!id || !businessId || !conversationId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    // Fetch the conversation metadata first
    const conversationMetaData = await Conversation.findOne({
      where: {
        id: conversationId,
      }
    });

    if (!conversationMetaData) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Conversation not found",
      });
    }

    // Fetch the conversation details
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        businessId,
        [Op.or]: [
          { receiverId: id },
        ],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Conversation not found",
      });
    }

    // Determine the receiverId
    const receiverId = conversation.receiverId === id ? conversation.senderId : conversation.receiverId;

    // Fetch all messages in the conversation
    const messages = await Message.findAll({
      where: {
        conversationId,
        [Op.or]: [
          { senderId: id },
          { senderId: receiverId },
        ],
        receiverDelete: false,
      },
      order: [["createdAt", "ASC"]],
    });

    // Separate messages into sent and received
    const sentMessages = messages.filter((msg) => msg.senderId === id);
    const receivedMessages = messages.filter((msg) => msg.senderId === receiverId);

    const conversationData = {
      conversation: conversationMetaData,
      sent: sentMessages,
      received: receivedMessages,
    };

    res.status(200).json({
      status: "SUCCESS",
      message: "Messages successfully retrieved!",
      data: conversationData,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.messageExist = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const checkMessage = await Message.findOne({
      where: {
        senderId: id,
      }
    });

    if (!checkMessage) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Messages not found",
        data: false
      });
    } else {
      return res.status(200).json({
        status: "SUCCESS",
        message: "There are messages for that user",
        data: true
      });
    }
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
}

exports.count = async (req, res) => {
  try {
    let id = req.user.id;
    let senderId = req.params.senderId;
    let conversationId = req.body;

    if (!id || !senderId || !conversationId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Reciever ID is required.",
      });
    }
    const totalCount = await Message.count({
      where: {
        receiverId: id,
        senderId,
        conversationId,
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
exports.allCount = async (req, res) => {
  try {
    let id = req.user.id;

    if (!id) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Reciever ID is required.",
      });
    }
    const totalCount = await Message.count({
      where: {
        receiverId: id,
        userType: "User",
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
exports.allBusinessCount = async (req, res) => {
  try {
    let id = req.user.id;
    let { businessId } = req.params;

    if (!id || !businessId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Receiver/Business ID is required.",
      });
    }

    let allBusinessTotalCount = 0;

    const allBusinessIds = await Conversation.findAll({
      where: { businessId },
      attributes: ["businessId", "id"],
    });

    for (const business of allBusinessIds) {
      const count = await Message.count({
        where: {
          receiverId: id,
          conversationId: business.id,
          viewed: false,
        },
      });
      allBusinessTotalCount += count;
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Total count successfully retrieved!",
      count: allBusinessTotalCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    let id = req.user.id;
    let { receiverId, message, messageId } = req.body;

    if (!receiverId || !message || !messageId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty input fields",
      });
    }

    message = CapitalizeFirstLetter(message);

    const checksender = await User.findOne({
      where: {
        id,
      },
    });

    if (!checksender) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Sender does not exist",
      });
    }

    const checkReciever = await User.findOne({
      where: {
        id: receiverId,
      },
    });

    if (!checkReciever) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Receiver does not exist",
      });
    }

    const [updated] = await Message.update(
      { message, viewed: false },
      {
        where: {
          id: messageId,
          receiverId,
          senderId: id,
        },
      }
    );

    if (updated) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Message successfully updated!",
      });
    } else {
      return res.status(500).json({
        status: "FAILURE",
        message: "Failed to update Message.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.viewed = async (req, res) => {
  try {
    const receiverId = req.user.id;
    const {senderId } = req.params;
    const {conversationId} = req.body;

    if (!receiverId || !senderId || !conversationId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }

    const checkUser = await User.findOne({
      where: { id: receiverId },
    });
    if (!checkUser) {
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist!",
      });
    }

    await Message.update(
      { viewed: true },
      {
        where: {
         receiverId,
         conversationId,
         senderId
        },
      }
    );

    res.status(200).json({
      status: "SUCCESS",
      message: "Message statuses successfully updated!",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.delete = async (req, res) => {
  try {
    let id = req.user.id;
    let { messageId } = req.params;

    if (id === "" || messageId == "") {
      res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    } else {
      const checkUser = await User.findOne({
        where: {
          id,
        },
      });
      if (!checkUser) {
        return res.status(200).json({
          status: "FAILURE",
          message: "User does not exist!",
        });
      }
      const checkMessage = await Message.findOne({
        where: {
          id: messageId,
        },
      });
      if (checkMessage) {
        await Message.destroy({
          where: {
            id: messageId,
          },
        });
        const checkDeleteConversationId = await Message.findOne({
          where:{
            conversationId:checkMessage.conversationId
          }
        });
        if(!checkDeleteConversationId){
          await Conversation.destroy({
            where:{
              id:checkMessage.conversationId
            }
          })
        }
        res.status(200).json({
          status: "SUCCESS",
          message: "Message deleted for all users",
        });
      } else {
        res.status(404).json({
          status: "FAILURE",
          message: "Message with the provided id does not exist.",
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.deleteSent = async (req, res) => {
  try {
    let id = req.user.id;
    let { messageId } = req.params;

    if (id === "" || messageId == "") {
      res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    } else {
      const checkUser = await User.findOne({
        where: {
          id,
        },
      });
      if (!checkUser) {
        return res.status(200).json({
          status: "FAILURE",
          message: "User does not exist!",
        });
      }
      const checkMessage = await Message.findOne({
        where: {
          id: messageId,
        },
      });
      if (checkMessage) {
        await Message.update(
          {senderDelete: true},
          {
            where: {
              id: messageId,
            },
          }
        );
        const deleteMessageCompletely = await Message.findOne({
          where:{
            id:messageId,
            receiverDelete: true,
            senderDelete:true
          }
        });
        if(deleteMessageCompletely){
          await Message.destroy({
            where:{
              id: messageId
            }
          })
        }
        const checkDeleteConversationId = await Message.findOne({
          where:{
            conversationId:checkMessage.conversationId
          }
        });
        if(!checkDeleteConversationId){
          await Conversation.destroy({
            where:{
              id:checkMessage.conversationId
            }
          })
        }
        res.status(200).json({
          status: "SUCCESS",
          message: "Message successfully deleted!",
        });
      } else {
        res.status(404).json({
          status: "FAILURE",
          message: "Message with the provided id does not exist.",
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.deleteReceived = async (req, res) => {
  try {
    let id = req.user.id;
    let { messageId } = req.params;

    if (id === "" || messageId == "") {
      res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    } else {
      const checkUser = await User.findOne({
        where: {
          id,
        },
      });
      if (!checkUser) {
        return res.status(200).json({
          status: "FAILURE",
          message: "User does not exist!",
        });
      }
      const checkMessage = await Message.findOne({
        where: {
          id: messageId,
        },
      });
      if (checkMessage) {
        await Message.update(
          {receiverDelete: true},
          {
            where: {
              id: messageId,
            },
          }
        );
        const deleteMessageCompletely = await Message.findOne({
          where:{
            id:messageId,
            receiverDelete: true,
            senderDelete:true
          }
        });
        if(deleteMessageCompletely){
          await Message.destroy({
            where:{
              id: messageId
            }
          })
        }
        const checkDeleteConversationId = await Message.findOne({
          where:{
            conversationId:checkMessage.conversationId
          }
        });
        if(!checkDeleteConversationId){
          await Conversation.destroy({
            where:{
              id:checkMessage.conversationId
            }
          })
        }
        res.status(200).json({
          status: "SUCCESS",
          message: "Message successfully deleted!",
        });
      } else {
        res.status(404).json({
          status: "FAILURE",
          message: "Message with the provided id does not exist.",
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { conversationId } = req.params; 

    if (!userId || !conversationId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty user ID or conversation ID",
      });
    }

   
    const messages = await Message.findAll({
      where: {
        conversationId,
        [Op.or]: [
          { senderId: userId },    // User is the sender
          { receiverId: userId },  // User is the receiver
        ],
      },
    });

    if (messages.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message: "No messages found for this conversation",
      });
    }

    
    await Promise.all(messages.map(async (message) => {
      if (message.senderId === userId) {
  
        message.senderDelete = true;
      } else if (message.receiverId === userId) {

        message.receiverDelete = true;
      }

      await message.save();

      if (message.senderDelete && message.receiverDelete) {
        await Message.destroy({ where: { id: message.id } });
      
        const checkDeleteConversationId = await Message.findOne({
          where:{
            conversationId
          }
        });
        if(!checkDeleteConversationId){
          await Conversation.destroy({
            where:{
              id:conversationId
            }
          })
        }
      }
    }));

    return res.status(200).json({
      status: "SUCCESS",
      message: "Conversation messages successfully deleted (marked for this user only)",
    });

  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};