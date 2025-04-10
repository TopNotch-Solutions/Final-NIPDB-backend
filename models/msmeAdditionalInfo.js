const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const MsmeAdditionalInfo = sequelize.define(
    "msme-additional-informations",
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
          numberOfEmployees: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          businessLogo: {
            type: DataTypes.STRING, 
            allowNull: true,
          },
          image1: {
            type: DataTypes.STRING, 
            allowNull: true,
          },
          image2: {
            type: DataTypes.STRING, 
            allowNull: true,
          },
          image3: {
            type: DataTypes.STRING, 
            allowNull: true,
          },
    },{
        timestamps: false 
      }
);

module.exports = MsmeAdditionalInfo;