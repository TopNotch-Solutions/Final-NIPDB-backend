const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");
const User = require("./user");

const Conversation = sequelize.define(
  "conversations",
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
    businessId: {
      type: DataTypes.BIGINT,
        allowNull: false,
      },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
  }
);

User.hasMany(Conversation, { as: 'sentConversations', foreignKey: 'senderId' });
User.hasMany(Conversation, { as: 'receivedConversations', foreignKey: 'receiverId' });
Conversation.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Conversation.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });

module.exports = Conversation;
