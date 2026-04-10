const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");
const User = require("./user");
const MsmeInformation = require("./msmeInformation");

const BusinessRating = sequelize.define(
  "business-ratings",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    businessId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
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

User.hasMany(BusinessRating, { foreignKey: "userId" });
BusinessRating.belongsTo(User, { foreignKey: "userId" });

MsmeInformation.hasMany(BusinessRating, { foreignKey: "businessId" });
BusinessRating.belongsTo(MsmeInformation, { foreignKey: "businessId" });

module.exports = BusinessRating;
