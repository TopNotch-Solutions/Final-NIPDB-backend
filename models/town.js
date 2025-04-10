const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const Town = sequelize.define(
  "towns",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    townName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    regionId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
  },
  {
    timestamps: false,
  }
);

module.exports = Town;