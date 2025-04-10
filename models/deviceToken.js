const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const DeviceToken = sequelize.define(
  "device-tokens",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    deviceToken: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    }
  },
  {
    timestamps: false,
  }
);

module.exports = DeviceToken;
