const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const OldUser = sequelize.define(
    "old-users",
    {
    
        user_login: {
            type: DataTypes.STRING,
            allowNull: false
          },
          user_email: {
            type: DataTypes.STRING,
            allowNull: false
          },
          source_user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          user_nicename: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          user_url: {
            type: DataTypes.STRING,
            allowNull: false
          },
          user_registered: {
            type: DataTypes.DATE,
            allowNull: false
          },
          display_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          role: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          nickname: {
            type: DataTypes.STRING,
            allowNull: false
          },
          first_name: {
            type: DataTypes.STRING,
            allowNull: false
          },
          last_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          pinterest: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          country: {
            type: DataTypes.STRING,
            allowNull: false
          },
          state: {
            type: DataTypes.STRING,
            allowNull: false
          },
          city: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          zipcode: {
            type: DataTypes.INTEGER,
            allowNull: false
          },
          address2: {
            type: DataTypes.STRING,
            allowNull: false
          },
          phone: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          address: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          wfls_last_login: {
            type: DataTypes.INTEGER,
            allowNull: false,
          }
    },{
        timestamps: false 
      }
);

module.exports = OldUser;