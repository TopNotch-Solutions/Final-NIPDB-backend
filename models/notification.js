const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const Notification = sequelize.define(
    "notifications",
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
          title: {
            type: DataTypes.STRING,
            allowNull: false
          },
          notification: {
            type: DataTypes.TEXT('long'),
            allowNull: false
          },
          senderId: {
            type: DataTypes.BIGINT,
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
        timestamps: true 
      }
);
// MsmeInformation.hasOne(MsmeFounderInfo, { as: 'founderInfo', foreignKey: 'businessId' });
// MsmeInformation.hasOne(MsmeContactInfo, { as: 'contactInfo', foreignKey: 'businessId' });
// MsmeInformation.hasOne(MsmeAdditionalInfo, { as: 'additionalInfo', foreignKey: 'businessId' });

// MsmeFounderInfo.belongsTo(MsmeInformation, { foreignKey: 'businessId' });
// MsmeContactInfo.belongsTo(MsmeInformation, { foreignKey: 'businessId' });
// MsmeAdditionalInfo.belongsTo(MsmeInformation, { foreignKey: 'businessId' });

module.exports = Notification;