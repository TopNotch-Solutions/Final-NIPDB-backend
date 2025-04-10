const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");
const User = require("./user");
const Conversation = require("./conversation");

const Message = sequelize.define(
  "messages",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    viewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    senderDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    receiverDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userType:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    conversationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Conversation,
        key: 'id'
      }
    },
  },
  {
    timestamps: false,
  }
);

User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId' });
Conversation.hasMany(Message, { as: 'messages', foreignKey: 'conversationId' });
Message.belongsTo(User, { foreignKey: 'senderId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

module.exports = Message;
