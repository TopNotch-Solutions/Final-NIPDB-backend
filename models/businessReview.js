const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");
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
    businessId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

MsmeInformation.hasMany(BusinessReview, { foreignKey: "businessId" });
BusinessReview.belongsTo(MsmeInformation, { foreignKey: "businessId" });

module.exports = BusinessReview;
