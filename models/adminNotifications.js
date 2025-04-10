const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const AdminNotification = sequelize.define(
    "admin-notifications",
    {
        id: {
          type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },

          userId: {
            type: DataTypes.BIGINT,
            allowNull: false
          },
          notification: {
            type: DataTypes.TEXT('long'),
            allowNull: false
          },
          createdAt: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            get() {
              const rawValue = this.getDataValue('createdAt');
              return rawValue ? rawValue.toISOString().split('T')[0] : null;
            },
          },
          viewed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
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

module.exports = AdminNotification;