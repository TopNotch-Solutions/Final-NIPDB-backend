const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");
const { toDefaultValue } = require("sequelize/lib/utils");

const Admin = sequelize.define(
    "admins",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },

        firstName: {
            type: DataTypes.STRING,
            allowNull: false
          },
          lastName: {
            type: DataTypes.STRING,
            allowNull: false
          },
          contactNumber: {
            type: DataTypes.STRING,
            allowNull: false
          },
          email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
              }
          },
          password: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          department:{
            type: DataTypes.STRING,
            allowNull: false,
          },
          profileImage: {
            type: DataTypes.TEXT('long'), 
            allowNull: true,
          },
          role: {
            type: DataTypes.ENUM,
            values: ['Admin', 'Super admin'],
            allowNull: false,
            validate: {
              isIn: {
                args: [['Admin', 'Super admin']],
                msg: "Role must be either 'Admin' or 'Super admin'"
              }
            }
          },
          createdAt: {
            type: DataTypes.DATE, 
            allowNull: true,
            defaultValue: Date.now()
          },
    },{
        timestamps: false 
      }
);

module.exports = Admin;