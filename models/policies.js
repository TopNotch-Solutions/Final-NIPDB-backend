const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const Policy = sequelize.define(
    "policy",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
          policy: {
            type: DataTypes.TEXT,
            allowNull: false
          }
    },{
        timestamps: true
      }
);

module.exports = Policy;