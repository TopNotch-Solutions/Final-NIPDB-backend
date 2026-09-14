const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");
const User = require("./user");
const MsmeInformation = require("./msmeInformation");

const BusinessReview = sequelize.define(
  "business-reviews",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
    },
    businessId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    reviewImage: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "businessId"],
      },
    ],
  }
);

User.hasMany(BusinessReview, { foreignKey: "userId" });
BusinessReview.belongsTo(User, { foreignKey: "userId" });

MsmeInformation.hasMany(BusinessReview, { foreignKey: "businessId" });
BusinessReview.belongsTo(MsmeInformation, { foreignKey: "businessId" });

module.exports = BusinessReview;
