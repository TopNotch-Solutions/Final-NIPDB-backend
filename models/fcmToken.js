const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const FcmToken = sequelize.define(
  "fcm-tokens",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.BIGINT,
        allowNull: false,
      },
    deviceToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM,
      values: ['User', 'Business'],
      allowNull: false,
      validate: {
        isIn: {
          args: [['User', 'Business']],
          msg: "Role must be either 'User' or 'Business'"
        }
      }
    },
  },
  {
    timestamps: false,
  }
);

module.exports = FcmToken;
