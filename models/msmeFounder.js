const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const MsmeFounderInfo = sequelize.define(
    "msme-founder-informations",
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
          founderName: {
            type: DataTypes.STRING,
            allowNull: true
          },
          founderAge: {
            type: DataTypes.INTEGER,
            allowNull: true
          },
          founderGender: {
            type: DataTypes.ENUM,
            values: ['Male', 'Female'],
            allowNull: true,
            validate: {
              isIn: {
                args: [['Male', 'Female']],
                msg: "Status must be either 'Male' or 'Female'"
              }
            }
          }  
    },{
        timestamps: false 
      }
);

module.exports = MsmeFounderInfo;