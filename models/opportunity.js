const { DataTypes , Sequelize} = require("sequelize");
const sequelize = require("../config/dbConfig");

const Opportunity = sequelize.define(
  "opportunities",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    description:{
      type: DataTypes.STRING,
      allowNull: false,
    },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      link:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      user: {
        type: DataTypes.ENUM,
        values: ['General User', 'Business User'],
        allowNull: false,
        validate: {
          isIn: {
            args: [['General User', 'Business User']],
            msg: "Type of user must be either 'General User' or 'Business User'"
          }
        }
      },
      dateUploaded: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW 
      },
  },
  {
    timestamps: false,
  }
);

module.exports = Opportunity;
