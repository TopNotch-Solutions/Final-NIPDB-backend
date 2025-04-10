const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const BusinessHour = sequelize.define(
    "msme-business-hours",
    {
        id: {
          type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
          businessId: {
            type: DataTypes.BIGINT,
            allowNull: false
          },
          monday: {
            type: DataTypes.STRING,
            allowNull: true
          },
          tuesday: {
            type: DataTypes.STRING,
            allowNull: true
          },
        wednesday: {
            type: DataTypes.STRING,
            allowNull: true
          },
          thursday: {
            type: DataTypes.STRING,
            allowNull: true
          },
          friday: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          saturday: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          sunday: {
            type: DataTypes.STRING,
            allowNull: true,
          }
    },{
        timestamps: false 
      }
);

module.exports = BusinessHour;