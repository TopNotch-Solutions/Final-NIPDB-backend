const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");
const User = require("./user");
const Admin = require("./admin");
const MsmeInformation = require("./msmeInformation");

const ALLOWED_REPORT_TITLES = [
  "I just don't like it",
  "Bullying or unwanted contact",
  "Suicide, self-injury or eating disorders",
  "Violence, hate or exploitation",
  "Selling or promoting restricted items",
  "Nudity or sexual activity",
  "Scam, fraud or spam",
  "False information",
  "Intellectual property",
];

const BusinessReport = sequelize.define(
  "business-reports",
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [ALLOWED_REPORT_TITLES],
          msg: "Invalid report title",
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    timestamps: true,
  }
);

User.hasMany(BusinessReport, { foreignKey: "userId", as: "reports", constraints: false });
BusinessReport.belongsTo(User, { foreignKey: "userId", as: "reporter", constraints: false });

MsmeInformation.hasMany(BusinessReport, { foreignKey: "businessId", as: "reports", constraints: false });
BusinessReport.belongsTo(MsmeInformation, { foreignKey: "businessId", as: "business", constraints: false });

Admin.hasMany(BusinessReport, { foreignKey: "readBy", as: "readReports", constraints: false });
BusinessReport.belongsTo(Admin, { foreignKey: "readBy", as: "readByAdmin", constraints: false });

module.exports = BusinessReport;
module.exports.ALLOWED_REPORT_TITLES = ALLOWED_REPORT_TITLES;
