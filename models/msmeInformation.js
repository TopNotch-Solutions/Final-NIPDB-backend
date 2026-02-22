const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");
const MsmeFounderInfo = require("./msmeFounder");
const MsmeContactInfo = require("./msmeContactInfo");
const MsmeAdditionalInfo = require("./msmeAdditionalInfo");
const BusinessHour = require("./businessHour");

const MsmeInformation = sequelize.define(
    "msme-informations",
    {
        id: {
          type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },

          businessRegistrationName: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
          },
          businessRegistrationNumber: {
            type: DataTypes.STRING,
            allowNull: true
          },
          businessDisplayName: {
            type: DataTypes.STRING,
            allowNull: true
          },
          typeOfBusiness: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          description: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          region: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          town: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          primaryIndustry: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          secondaryIndustry: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          yearOfEstablishment: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          annualTurnover:{
            type: DataTypes.STRING,
            allowNull: true,
          },
          isVisibility: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true, 
          },
          isBlocked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false, 
          },
          status: {
            type: DataTypes.ENUM,
            values: ['Approved', 'Pending', 'Rejected', 'Incomplete'],
            allowNull: false,
            defaultValue: 'Pending',
            validate: {
              isIn: {
                args: [['Approved', 'Pending', 'Rejected', 'Incomplete']],
                msg: "Status must be either 'Approved', 'Pending' or 'Rejected'"
              }
            }
          },
          userId: {
            type: DataTypes.BIGINT,
            allowNull: false
          },
          createdAt:{
            type: DataTypes.DATE,
             defaultValue: new Date,
            allowNull: false,
            get() {
              const rawValue = this.getDataValue('createdAt');
              return rawValue ? rawValue.toISOString().split('T')[0] : null;
            },
          }
          
    },{
        timestamps: false
      }
);
MsmeInformation.hasOne(MsmeFounderInfo, { as: 'founderInfo', foreignKey: 'businessId' });
MsmeInformation.hasOne(MsmeContactInfo, { as: 'contactInfo', foreignKey: 'businessId' });
MsmeInformation.hasOne(MsmeAdditionalInfo, { as: 'additionalInfo', foreignKey: 'businessId' });
MsmeInformation.hasOne(BusinessHour, {as: 'businessHours', foreignKey: 'businessId'});

MsmeFounderInfo.belongsTo(MsmeInformation, { foreignKey: 'businessId' });
MsmeContactInfo.belongsTo(MsmeInformation, { foreignKey: 'businessId' });
MsmeAdditionalInfo.belongsTo(MsmeInformation, { foreignKey: 'businessId' });
BusinessHour.belongsTo(MsmeInformation, { foreignKey: 'businessId' })

module.exports = MsmeInformation;