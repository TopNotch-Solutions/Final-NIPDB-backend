const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const BSO = sequelize.define(
    "bsos",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false
          },
          type: {
            type: DataTypes.STRING,
            allowNull: false
          },
        contactNumber: {
            type: DataTypes.STRING,
            allowNull: true
          },
          website: {
            type: DataTypes.STRING,
            allowNull: true
          },
          email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
              }
          },
          description: {
            type: DataTypes.STRING(700),
            allowNull: false,
          },
          logo: {
            type: DataTypes.STRING,
            allowNull: true,
          }
    },{
        timestamps: true
      }
);

module.exports = BSO;