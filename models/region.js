const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const Region = sequelize.define(
  "regions",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    regionName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Region;
