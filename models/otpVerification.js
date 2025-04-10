const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const OTP = sequelize.define(
  "otp-verifications",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    otp: {
        type: DataTypes.STRING, 
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING, 
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE, 
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE, 
        allowNull: false,
      },
  },
  {
    timestamps: false,
  }
);

module.exports = OTP;