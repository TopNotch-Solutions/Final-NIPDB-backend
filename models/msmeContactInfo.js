const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const MsmeContactInfo = sequelize.define(
    "msme-contact-informations",
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
          businessAddress: {
            type: DataTypes.STRING,
            allowNull: true
          },
          phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true
          },
          whatsAppNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ""
          },
          email: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          website: {
            type: DataTypes.STRING,
            allowNull: true,
             defaultValue: ""
          },
          twitter: {
            type: DataTypes.STRING,
            allowNull: true,
             defaultValue: ""
          },
          facebook: {
            type: DataTypes.STRING,
            allowNull: true,
             defaultValue: ""
          },
          instagram: {
            type: DataTypes.STRING,
            allowNull: true,
             defaultValue: ""
          },
          linkedIn: {
            type: DataTypes.STRING,
            allowNull: true,
             defaultValue: ""
          }
    },{
        timestamps: false 
      }
);

module.exports = MsmeContactInfo;