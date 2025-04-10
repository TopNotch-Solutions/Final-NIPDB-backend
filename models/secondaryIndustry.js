const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const SecondaryIndustry = sequelize.define(
  "secondary-industries",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    industryName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    }
  },
  {
    timestamps: false,
  }
);

module.exports = SecondaryIndustry;