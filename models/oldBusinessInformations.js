const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const OldBusinessInformation = sequelize.define(
    "old-business-informations",
    {
    
        title: {
            type: DataTypes.STRING,
            allowNull: false
          },
          content: {
            type: DataTypes.STRING,
            allowNull: false
          },
          excerpt: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          date: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          post_type: {
            type: DataTypes.STRING,
            allowNull: false
          },
          permalink: {
            type: DataTypes.STRING,
            allowNull: false
          },
          image_url: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          image_title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          image_featured: {
            type: DataTypes.STRING,
            allowNull: false
          },
          attachment_url: {
            type: DataTypes.STRING,
            allowNull: false
          },
          categories: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          features: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          tags: {
            type: DataTypes.STRING,
            allowNull: false
          },
          location: {
            type: DataTypes.STRING,
            allowNull: false
          },
          status: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          author_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          author_username: {
            type: DataTypes.INTEGER,
            allowNull: false
          },
          author_email: {
            type: DataTypes.STRING,
            allowNull: false
          },
          author_firstname: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          author_lastname: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          slug: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          format: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          template: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          post_modified_Date: {
            type: DataTypes.DATE,
            allowNull: false,
          }
    },{
        timestamps: false 
      }
);

module.exports = OldBusinessInformation;