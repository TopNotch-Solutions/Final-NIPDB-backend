const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const PushNotification = sequelize.define(
    "push-notifications",
    {
        id: {
          type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false
          },
          deviceToken: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          notification: {
            type: DataTypes.TEXT('long'),
            allowNull: false
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          viewed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          type: {
            type: DataTypes.STRING,
            values: ['Email', 'Alert', 'Message', 'Remainder'],
            allowNull: false,
            validate: {
              isIn: {
                args: [['Email', 'Alert', 'Message', 'Remainder']],
                msg: "Type must be either 'Email', 'Alert', 'Message' or 'Remainder'"
              }
            }
          },
          priority: {
            type: DataTypes.STRING,
            allowNull: true,
            values: ['High', 'Medium', 'Low'],
            validate: {
              isIn: {
                args: [['High', 'Medium', 'Low']],
                msg: "Priority must be either 'High', 'Medium' or 'Low'"
              }
            }
          }
          
    },{
        timestamps: false 
      }
);

module.exports = PushNotification;