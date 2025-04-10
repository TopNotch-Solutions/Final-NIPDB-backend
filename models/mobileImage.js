const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const MobileImage = sequelize.define(
  "mobile-images",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    description:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobileImage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    
  },
  {
    timestamps: false,
  }
);

module.exports = MobileImage;
