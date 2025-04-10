const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const Favourite = sequelize.define(
  "favourite-msmes",
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
    businessId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
  },
  {
    timestamps: false,
  }
);

module.exports = Favourite;
