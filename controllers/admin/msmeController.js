const MsmeInformation = require("../../models/msmeInformation");
const MsmeFounderInfo = require("../../models/msmeFounder");
const MsmeContactInfo = require("../../models/msmeContactInfo");
const MsmeAdditionalInfo = require("../../models/msmeAdditionalInfo");
const User = require("../../models/user");
const { where, Sequelize, Op } = require("sequelize");
const AdminNotification = require("../../models/adminNotifications");
const Admin = require("../../models/admin");
const Notification = require("../../models/notification");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const BusinessHour = require("../../models/businessHour");
const PrimaryIndustry = require("../../models/primaryIndustry");
const sequelize = require("../../config/dbConfig");
const { getMonthlyData } = require("../../utils/web/getMonthlyData");
const sendEmail = require("../../utils/mobile/sendEmail");
const fs = require("fs");
const path = require("path");
const adminFirebase = require("../../config/firebaseConfig");
const Region = require("../../models/region");
const Town = require("../../models/town");
const FcmToken = require("../../models/fcmToken");

exports.create = async (req, res) => {
  let {
      businessRegistrationName,
      businessRegistrationNumber,
      businessDisplayName,
      typeOfBusiness,
      description,
      region,
      town,
      userId,
      primaryIndustry,
      secondaryIndustry,
      yearOfEstablishment,
      annualTurnover,
      founderName,
      founderAge,
      founderGender,
      businessAddress,
      phoneNumber,
      whatsAppNumber,
      email,
      website,
      twitter,
      facebook,
      instagram,
      linkedln,
      numberOfEmployees,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    } = req.body;

    const requiredFields = [
      "businessRegistrationName",
      "businessDisplayName",
      "typeOfBusiness",
      "description",
      "region",
      "town",
      "primaryIndustry",
      "yearOfEstablishment",
      "annualTurnover",
      "founderName",
      "founderAge",
      "founderGender",
      "businessAddress",
      "monday",
      "tuesday",
      "wednesday",
      "friday",
      "saturday",
      "sunday",
      "phoneNumber",
      "email",
      "userId",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          status: "FAILURE",
          message: `${field} is required.`,
        });
      }
    }
  const transaction = await sequelize.transaction();

  try {
    
    businessRegistrationName = CapitalizeFirstLetter(businessRegistrationName);
    businessDisplayName = CapitalizeFirstLetter(businessDisplayName);
    typeOfBusiness = CapitalizeFirstLetter(typeOfBusiness);
    description = CapitalizeFirstLetter(description);
    town = CapitalizeFirstLetter(town);
    primaryIndustry = CapitalizeFirstLetter(primaryIndustry);
    secondaryIndustry = CapitalizeFirstLetter(secondaryIndustry);
    founderName = CapitalizeFirstLetter(founderName);
    founderGender = CapitalizeFirstLetter(founderGender);
    businessAddress = CapitalizeFirstLetter(businessAddress);

    const checkExistingUser = await User.findOne({
      where: { id: userId },
      transaction,
      lock: true,
    });

    if (!checkExistingUser)
      throw new Error("User does not exist.");

    const alreadyExist = await MsmeInformation.findOne({
      where: { businessRegistrationName },
      transaction,
    });

    if (alreadyExist)
      throw new Error("Business name already in use.");

 
    const selectedRegion = await Region.findOne({
      where: { id: region },
      transaction,
    });

    if (!selectedRegion)
      throw new Error("Invalid region selected.");

    const newInformation = await MsmeInformation.create(
      {
        businessRegistrationName,
        businessDisplayName,
        businessAddress,
        typeOfBusiness,
        description,
        region: selectedRegion.regionName,
        town,
        businessRegistrationNumber,
        primaryIndustry,
        secondaryIndustry,
        yearOfEstablishment,
        annualTurnover,
        userId,
      },
      { transaction }
    );

    await MsmeFounderInfo.create(
      {
        businessId: newInformation.id,
        founderName,
        founderAge,
        founderGender,
      },
      { transaction }
    );

    await MsmeContactInfo.create(
      {
        businessId: newInformation.id,
        businessAddress,
        phoneNumber,
        whatsAppNumber,
        email,
        website,
        twitter,
        facebook,
        instagram,
        linkedIn: linkedln,
      },
      { transaction }
    );

    const files = req.files;

    let businessLogo = files?.businessLogo
      ? files.businessLogo[0].filename
      : null;

    const image1 = files?.image1?.[0]?.filename || null;
    const image2 = files?.image2?.[0]?.filename || null;
    const image3 = files?.image3?.[0]?.filename || null;

    if (!businessLogo) {
      const businessIcon = await PrimaryIndustry.findOne({
        where: { industryName: primaryIndustry },
        transaction,
      });

      if (businessIcon?.industryIcon) {
        const sourcePath = path.join(
          "public",
          "primary-industries",
          businessIcon.industryIcon
        );
        const destPath = path.join(
          "public",
          "msmes",
          businessIcon.industryIcon
        );

        fs.copyFileSync(sourcePath, destPath);
        businessLogo = businessIcon.industryIcon;
      }
    }

    await MsmeAdditionalInfo.create(
      {
        businessId: newInformation.id,
        numberOfEmployees,
        businessLogo,
        image1,
        image2,
        image3,
      },
      { transaction }
    );

    await BusinessHour.create(
      {
        businessId: newInformation.id,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
      },
      { transaction }
    );

    const admins = await Admin.findAll({
      attributes: ["id"],
      transaction,
    });

    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        userId: admin.id,
        title: "New Business Application Submitted for Review",
        notification:
          "A new business application has been submitted. Please review it.",
        type: "Alert",
        priority: "High",
        viewed: false,
      }));

      await AdminNotification.bulkCreate(notifications, { transaction });
    }

    await Notification.create(
      {
        userId,
        senderId: userId,
        title: "Application Successfully Submitted.",
        notification:
          "Your application has been submitted successfully and is pending review.",
        type: "Alert",
        priority: "High",
        viewed: false,
      },
      { transaction }
    );

    await transaction.commit();

    sendEmail({
      email: checkExistingUser.email,
      subject: "Application to in4msme pending approval",
      notification: "pending",
    });

    return res.status(201).json({
      status: "SUCCESS",
      message: "Business successfully created!",
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server error",
    });
  }
};

exports.allUser = async (req, res) => {
  try {
    const allUsers = await User.findAll({
      order: [["lastName", "ASC"]],
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "All users retrieved successfully!",
      data: allUsers,
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.all = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
    });

    return res.status(200).json({
      status: "SUCCESS",
      totalRecords: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
      data: rows,
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: error.message,
    });
  }
};

exports.allApproved = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        status: "Approved",
      },
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
    });

    if (!rows.length) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No approved MSME records found.",
        data: []
      });
    }

    const formattedData = rows.map((info) => ({
      id: info.id,
      registrationName: info.businessRegistrationName,
      registrationNumber: info.businessRegistrationNumber,
      displayName: info.businessDisplayName,
      typeOfBusiness: info.typeOfBusiness,
      description: info.description,
      annualTurnOver: info.annualTurnover,
      yearOfEstablishment: info.yearOfEstablishment,
      email: info.contactInfo?.email || "",
      region: info.region,
      town: info.town,
      primaryIndustry: info.primaryIndustry,
      foundersName: info.founderInfo?.founderName || "",
      foundersGender: info.founderInfo?.founderGender || "",
      foundersAge: info.founderInfo?.founderAge || "",
      businessAddress: info.contactInfo?.businessAddress || "",
      phoneNumber: info.contactInfo?.phoneNumber || "",
      whatsAppNumber: info.contactInfo?.whatsAppNumber || "",
      businessEmail: info.contactInfo?.email || "",
      website: info.contactInfo?.website || "",
      twitter: info.contactInfo?.twitter || "",
      facebook: info.contactInfo?.facebook || "",
      instagram: info.contactInfo?.instagram || "",
      linkedln: info.contactInfo?.linkedIn || "",
      monday: info.businessHours?.monday || "",
      tuesday: info.businessHours?.tuesday || "",
      wednesday: info.businessHours?.wednesday || "",
      thursday: info.businessHours?.thursday || "",
      friday: info.businessHours?.friday || "",
      saturday: info.businessHours?.saturday || "",
      sunday: info.businessHours?.sunday || "",
      numberOfEmployees: info.additionalInfo?.numberOfEmployees || "",
      status: info.status,
      isBlocked: info.isBlocked,
      createdAt: info.createdAt,
    }));

    return res.status(200).json({
      status: "SUCCESS",
      totalRecords: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
      data: formattedData,
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.allPending = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        status: "Pending",
      },
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
    });

    if (!rows.length) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No pending MSME records found.",
        data: []
      });
    }

    const formattedData = rows.map((info) => ({
      id: info.id,
      registrationName: info.businessRegistrationName,
      registrationNumber: info.businessRegistrationNumber,
      displayName: info.businessDisplayName,
      typeOfBusiness: info.typeOfBusiness,
      description: info.description,
      annualTurnOver: info.annualTurnover,
      yearOfEstablishment: info.yearOfEstablishment,
      email: info.contactInfo?.email || "",
      region: info.region,
      town: info.town,
      primaryIndustry: info.primaryIndustry,
      foundersName: info.founderInfo?.founderName || "",
      foundersGender: info.founderInfo?.founderGender || "",
      foundersAge: info.founderInfo?.founderAge || "",
      businessAddress: info.contactInfo?.businessAddress || "",
      phoneNumber: info.contactInfo?.phoneNumber || "",
      whatsAppNumber: info.contactInfo?.whatsAppNumber || "",
      businessEmail: info.contactInfo?.email || "",
      website: info.contactInfo?.website || "",
      twitter: info.contactInfo?.twitter || "",
      facebook: info.contactInfo?.facebook || "",
      instagram: info.contactInfo?.instagram || "",
      linkedln: info.contactInfo?.linkedIn || "",
      monday: info.businessHours?.monday || "",
      tuesday: info.businessHours?.tuesday || "",
      wednesday: info.businessHours?.wednesday || "",
      thursday: info.businessHours?.thursday || "",
      friday: info.businessHours?.friday || "",
      saturday: info.businessHours?.saturday || "",
      sunday: info.businessHours?.sunday || "",
      numberOfEmployees: info.additionalInfo?.numberOfEmployees || "",
      status: info.status,
      isBlocked: info.isBlocked,
      createdAt: info.createdAt,
    }));

    return res.status(200).json({
      status: "SUCCESS",
      totalRecords: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
      data: formattedData,
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.allRejected = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        status: "Rejected",
      },
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
    });

    if (!rows.length) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No rejected MSME records found.",
        data: []
      });
    }

    const formattedData = rows.map((info) => ({
      id: info.id,
      registrationName: info.businessRegistrationName,
      registrationNumber: info.businessRegistrationNumber,
      displayName: info.businessDisplayName,
      typeOfBusiness: info.typeOfBusiness,
      description: info.description,
      annualTurnOver: info.annualTurnover,
      yearOfEstablishment: info.yearOfEstablishment,
      email: info.contactInfo?.email || "",
      region: info.region,
      town: info.town,
      primaryIndustry: info.primaryIndustry,
      foundersName: info.founderInfo?.founderName || "",
      foundersGender: info.founderInfo?.founderGender || "",
      foundersAge: info.founderInfo?.founderAge || "",
      businessAddress: info.contactInfo?.businessAddress || "",
      phoneNumber: info.contactInfo?.phoneNumber || "",
      whatsAppNumber: info.contactInfo?.whatsAppNumber || "",
      businessEmail: info.contactInfo?.email || "",
      website: info.contactInfo?.website || "",
      twitter: info.contactInfo?.twitter || "",
      facebook: info.contactInfo?.facebook || "",
      instagram: info.contactInfo?.instagram || "",
      linkedln: info.contactInfo?.linkedIn || "",
      monday: info.businessHours?.monday || "",
      tuesday: info.businessHours?.tuesday || "",
      wednesday: info.businessHours?.wednesday || "",
      thursday: info.businessHours?.thursday || "",
      friday: info.businessHours?.friday || "",
      saturday: info.businessHours?.saturday || "",
      sunday: info.businessHours?.sunday || "",
      numberOfEmployees: info.additionalInfo?.numberOfEmployees || "",
      status: info.status,
      isBlocked: info.isBlocked,
      createdAt: info.createdAt,
    }));

    return res.status(200).json({
      status: "SUCCESS",
      totalRecords: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
      data: formattedData,
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.allIncomplete = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        status: "Incomplete",
      },
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
    });

    if (!rows.length) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No incomplete MSME records found.",
        data: []
      });
    }

    const formattedData = rows.map((info) => ({
      id: info.id,
      registrationName: info.businessRegistrationName,
      registrationNumber: info.businessRegistrationNumber,
      displayName: info.businessDisplayName,
      typeOfBusiness: info.typeOfBusiness,
      description: info.description,
      annualTurnOver: info.annualTurnover,
      yearOfEstablishment: info.yearOfEstablishment,
      email: info.contactInfo?.email || "",
      region: info.region,
      town: info.town,
      primaryIndustry: info.primaryIndustry,
      foundersName: info.founderInfo?.founderName || "",
      foundersGender: info.founderInfo?.founderGender || "",
      foundersAge: info.founderInfo?.founderAge || "",
      businessAddress: info.contactInfo?.businessAddress || "",
      phoneNumber: info.contactInfo?.phoneNumber || "",
      whatsAppNumber: info.contactInfo?.whatsAppNumber || "",
      businessEmail: info.contactInfo?.email || "",
      website: info.contactInfo?.website || "",
      twitter: info.contactInfo?.twitter || "",
      facebook: info.contactInfo?.facebook || "",
      instagram: info.contactInfo?.instagram || "",
      linkedln: info.contactInfo?.linkedIn || "",
      monday: info.businessHours?.monday || "",
      tuesday: info.businessHours?.tuesday || "",
      wednesday: info.businessHours?.wednesday || "",
      thursday: info.businessHours?.thursday || "",
      friday: info.businessHours?.friday || "",
      saturday: info.businessHours?.saturday || "",
      sunday: info.businessHours?.sunday || "",
      numberOfEmployees: info.additionalInfo?.numberOfEmployees || "",
      status: info.status,
      isBlocked: info.isBlocked,
      createdAt: info.createdAt,
    }));

    return res.status(200).json({
      status: "SUCCESS",
      totalRecords: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
      data: formattedData,
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.allBlocked = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        isBlocked: true,
      },
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
    });

    if (!rows.length) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No blocked MSME records found.",
        data: []
      });
    }

    const formattedData = rows.map((info) => ({
      id: info.id,
      registrationName: info.businessRegistrationName,
      registrationNumber: info.businessRegistrationNumber,
      displayName: info.businessDisplayName,
      typeOfBusiness: info.typeOfBusiness,
      description: info.description,
      annualTurnOver: info.annualTurnover,
      yearOfEstablishment: info.yearOfEstablishment,
      email: info.contactInfo?.email || "",
      region: info.region,
      town: info.town,
      primaryIndustry: info.primaryIndustry,
      foundersName: info.founderInfo?.founderName || "",
      foundersGender: info.founderInfo?.founderGender || "",
      foundersAge: info.founderInfo?.founderAge || "",
      businessAddress: info.contactInfo?.businessAddress || "",
      phoneNumber: info.contactInfo?.phoneNumber || "",
      whatsAppNumber: info.contactInfo?.whatsAppNumber || "",
      businessEmail: info.contactInfo?.email || "",
      website: info.contactInfo?.website || "",
      twitter: info.contactInfo?.twitter || "",
      facebook: info.contactInfo?.facebook || "",
      instagram: info.contactInfo?.instagram || "",
      linkedln: info.contactInfo?.linkedIn || "",
      monday: info.businessHours?.monday || "",
      tuesday: info.businessHours?.tuesday || "",
      wednesday: info.businessHours?.wednesday || "",
      thursday: info.businessHours?.thursday || "",
      friday: info.businessHours?.friday || "",
      saturday: info.businessHours?.saturday || "",
      sunday: info.businessHours?.sunday || "",
      numberOfEmployees: info.additionalInfo?.numberOfEmployees || "",
      status: info.status,
      isBlocked: info.isBlocked,
      createdAt: info.createdAt,
    }));

    return res.status(200).json({
      status: "SUCCESS",
      totalRecords: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
      data: formattedData,
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.single = async (req, res) => {
  const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }
  try {
    

    const msmeInformation = await MsmeInformation.findOne({
      where: { id },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
    });

    if (!msmeInformation) {
      return res.status(404).json({
        status: "FAILURE",
        message: "MSME information not found",
      });
    }

    let regionId, migratedTown;
    if (msmeInformation.status !== "Incomplete") {
      const regionRecord = await Region.findOne({
        where: { regionName: msmeInformation.region },
      });
      regionId = regionRecord?.id || null;
    } else {
      const defaultRegion = await Region.findOne({ order: [["id", "ASC"]] });
      regionId = defaultRegion?.id || null;
      migratedTown = await Town.findOne({
        where: { regionId: regionId },
      });
    }

    const formattedData = {
      id: msmeInformation.id,
      businessRegistrationName: msmeInformation.businessRegistrationName,
      businessRegistrationNumber: msmeInformation.businessRegistrationNumber,
      businessDisplayName: msmeInformation.businessDisplayName,
      typeOfBusiness: msmeInformation.typeOfBusiness,
      description: msmeInformation.description,
      region: regionId,
      town:
        msmeInformation.status === "Incomplete"
          ? migratedTown
          : msmeInformation.town,
      primaryIndustry: msmeInformation.primaryIndustry,
      secondaryIndustry: msmeInformation.secondaryIndustry,
      yearOfEstablishment: msmeInformation.yearOfEstablishment,
      annualTurnover: msmeInformation.annualTurnover,
      isVisibility: msmeInformation.isVisibility,
      isBlocked: msmeInformation.isBlocked,
      status: msmeInformation.status,
      userId: msmeInformation.userId,
      createdAt: msmeInformation.createdAt,
      founderInfo: msmeInformation.founderInfo,
      contactInfo: msmeInformation.contactInfo,
      additionalInfo: msmeInformation.additionalInfo,
      businessHours: msmeInformation.businessHours,
    };

    return res.status(200).json({
      status: "SUCCESS",
      message: "MSME information retrieved successfully",
      data: formattedData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.singleMsme = async (req, res) => {
  const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required",
      });
    }

  try {
    
    const msmeInformation = await MsmeInformation.findOne({
      where: { id },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
    });

    if (!msmeInformation) {
      return res.status(404).json({
        status: "FAILURE",
        message: "MSME information not found",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "MSME information retrieved successfully",
      data: msmeInformation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.totalCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Total MSME count retrieved successfully",
      count: totalCount || 0,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.pendingCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count({
      where: { status: "Pending" },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Pending MSME count retrieved successfully",
      count: totalCount || 0, 
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.rejectedCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count({
      where: { status: "Rejected" },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Rejected MSME count retrieved successfully",
      count: totalCount || 0,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.incompleteCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count({
      where: { status: "Incomplete" },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Incomplete MSME count retrieved successfully",
      count: totalCount || 0,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.approvedCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count({
      where: { status: "Approved" },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Approved MSME count retrieved successfully",
      count: totalCount || 0,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.topCategory = async (req, res) => {
  try {
    const topIndustries = await MsmeInformation.findAll({
      attributes: [
        "primaryIndustry",
        [sequelize.fn("COUNT", sequelize.col("primaryIndustry")), "industryCount"],
      ],
      group: ["primaryIndustry"],
      order: [[sequelize.literal("industryCount"), "DESC"]],
      having: sequelize.where(
        sequelize.fn("COUNT", sequelize.col("primaryIndustry")),
        ">",
        0
      ),
      limit: 5,
    });

    let finalIndustries = topIndustries;

    if (topIndustries.length < 5) {
      const allIndustries = await MsmeInformation.findAll({
        attributes: ["primaryIndustry"],
        group: ["primaryIndustry"],
        order: [["primaryIndustry", "ASC"]],
      });

      const topIndustryNames = topIndustries.map(i => i.primaryIndustry);
      const missingIndustries = allIndustries
        .map(i => i.primaryIndustry)
        .filter(name => !topIndustryNames.includes(name))
        .slice(0, 5 - topIndustries.length);

      finalIndustries = [
        ...topIndustries,
        ...missingIndustries.map(name => ({ primaryIndustry: name, industryCount: 0 }))
      ].slice(0, 5);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Top industries retrieved successfully",
      data: finalIndustries,
    });
  } catch (error) {
    console.error("Error fetching top industries:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.monthlyRegistration = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthsData = [];

    for (let month = 1; month <= 12; month++) {
      const currentMonthCount = await MsmeInformation.count({
        where: {
          [Op.and]: [
            Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("createdAt")), currentYear),
            Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("createdAt")), month),
          ],
        },
      });

      const previousMonthCount = await MsmeInformation.count({
        where: {
          [Op.and]: [
            Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("createdAt")), currentYear - 1),
            Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("createdAt")), month),
          ],
        },
      });

      monthsData.push({
        date: `${currentYear}-${month.toString().padStart(2, "0")}`,
        currentMonth: currentMonthCount,
        previousMonth: previousMonthCount,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Monthly registration data retrieved successfully",
      data: monthsData,
    });
  } catch (error) {
    console.error("Error fetching monthly registration data:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.update = async (req, res) => {
  const { businessId } = req.params;
    const {
      businessRegistrationName,
      businessRegistrationNumber,
      businessDisplayName,
      typeOfBusiness,
      description,
      region,
      town,
      primaryIndustry,
      secondaryIndustry,
      yearOfEstablishment,
      annualTurnover,
      founderName,
      founderAge,
      founderGender,
      businessAddress,
      phoneNumber,
      whatsAppNumber,
      email,
      website,
      twitter,
      facebook,
      instagram,
      linkedln,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      numberOfEmployees,
      removeImage,
      removeImage1,
      removeImage2,
      removeImage3,
    } = req.body;
  const transaction = await sequelize.transaction(); // start transaction
  try {
    

    const business = await MsmeInformation.findOne({ where: { id: businessId }, transaction });
    if (!business) { return res.status(404).json({ status: "FAILURE", message: "Business not found.", }); }

    if (businessRegistrationName !== business.businessRegistrationName) {
      const alreadyExist = await MsmeInformation.findOne({ where: { businessRegistrationName }, transaction });
      if (alreadyExist) { return res.status(404).json({ status: "FAILURE", message: "Business name already in use.", }); }
    }

    const selectedRegion = await Region.findOne({ where: { id: region }, transaction });

    const existingAdditional = await MsmeAdditionalInfo.findOne({ where: { businessId }, transaction });

    const removeFile = (fileName) => {
      if (fileName) {
        const filePath = path.join("public", "msmes", fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    };

    const handleImageUpdate = async (imageField, removeFlag) => {
      if (removeFlag) {
        removeFile(existingAdditional?.[imageField]);
        await MsmeAdditionalInfo.update({ [imageField]: null }, { where: { businessId }, transaction });
      }
      if (req.files?.[imageField]?.[0]?.filename) {
        const newFile = req.files[imageField][0].filename;
        removeFile(existingAdditional?.[imageField]);
        await MsmeAdditionalInfo.update({ [imageField]: newFile }, { where: { businessId }, transaction });
      }
    };

    await MsmeInformation.update(
      {
        businessRegistrationName,
        businessDisplayName,
        typeOfBusiness,
        description,
        region: selectedRegion.regionName,
        town,
        businessRegistrationNumber,
        primaryIndustry,
        secondaryIndustry,
        yearOfEstablishment,
        annualTurnover,
      },
      { where: { id: businessId }, transaction }
    );

    await MsmeFounderInfo.update(
      { founderName, founderAge, founderGender },
      { where: { businessId }, transaction }
    );

    await MsmeContactInfo.update(
      {
        businessAddress,
        phoneNumber,
        whatsAppNumber,
        email,
        website,
        twitter,
        facebook,
        instagram,
        linkedIn: linkedln,
      },
      { where: { businessId }, transaction }
    );

    if (removeImage) {
      removeFile(existingAdditional?.businessLogo);

      const businessIcon = await PrimaryIndustry.findOne({ where: { industryName: primaryIndustry }, transaction });
      if (businessIcon?.industryIcon) {
        const sourcePath = path.join("public", "primary-industries", businessIcon.industryIcon);
        const destPath = path.join("public", "msmes", businessIcon.industryIcon);
        fs.copyFileSync(sourcePath, destPath);
        await MsmeAdditionalInfo.update({ businessLogo: businessIcon.industryIcon }, { where: { businessId }, transaction });
      }
    }

    if (req.files?.businessLogo?.[0]?.filename) {
      const newLogo = req.files.businessLogo[0].filename;
      removeFile(existingAdditional?.businessLogo);
      await MsmeAdditionalInfo.update({ businessLogo: newLogo }, { where: { businessId }, transaction });
    }

    await MsmeAdditionalInfo.update({ numberOfEmployees }, { where: { businessId }, transaction });

    // Handle other images
    await handleImageUpdate("image1", removeImage1);
    await handleImageUpdate("image2", removeImage2);
    await handleImageUpdate("image3", removeImage3);

    await BusinessHour.update(
      { monday, tuesday, wednesday, thursday, friday, saturday, sunday },
      { where: { businessId }, transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business successfully updated!",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating business:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.status = async (req, res) => {
  let id = parseInt(req.params.id);
    const { status } = req.body;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }
    if (!status) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Status is required.",
      });
    }
  const transaction = await sequelize.transaction();
  try {
    

    const existingUser = await Admin.findOne({ where: { id: userId }, transaction });
    if (!existingUser) { return res.status(404).json({ status: "FAILURE", message: "The user you are trying to access does not exist.", }); }

    const existingBusiness = await MsmeInformation.findOne({ where: { id }, transaction });
    if (!existingBusiness) { return res.status(404).json({ status: "FAILURE", message: "The business does not exist.", }); }

    const user = await User.findOne({ where: { id: existingBusiness.userId }, transaction });
    if (!user) { return res.status(404).json({ status: "FAILURE", message: "The business does not exist.", }); }

    await MsmeInformation.update({ status }, { where: { id }, transaction });

    const messages = {
      Approved: {
        title: "Approved - Welcome to in4msme",
        body: `Dear Entrepreneur,
Your account has been approved! Your business profile is now visible to potential customers, investors, and business support organisations.
You can hide your profile in settings if needed.
Questions? Contact msme.eo@nipdb.com
Kind Regards, NIPDB`,
        type: "approved",
      },
      Rejected: {
        title: "Application to in4msme declined",
        body: `Dear Entrepreneur,
Your application was unsuccessful. Possible reasons include false information, inconsistencies, non-compliance, or policy violations.
Please review feedback and feel free to reapply.
Questions? Contact msme.eo@nipdb.com or call 083 333 8619.
Kind Regards, NIPDB`,
        type: "rejected",
      },
    };

    const statusMessage = status === "Approved" ? messages.Approved : messages.Rejected;

    await Notification.create(
      {
        userId: existingBusiness.userId,
        title: statusMessage.title,
        notification: statusMessage.body,
        type: "Alert",
        priority: "High",
        createdAt: Date.now(),
        senderId: userId,
        viewed: false,
      },
      { transaction }
    );

    sendEmail({ email: user.email, subject: statusMessage.title, notification: statusMessage.type });

    FcmToken.findAll({ where: { userId: existingBusiness.userId }, attributes: ["deviceToken"] })
      .then((deviceTokens) => {
        if (!deviceTokens.length) return;
        const messagePayload = {
          notification: { title: statusMessage.title, body: statusMessage.body },
          data: {
            title: statusMessage.title,
            body: statusMessage.body,
            type: "status_update",
            click_action: "NOTIFICATION_CLICK",
          },
          android: { priority: "high", notification: { sound: "default", channelId: "default-channel-id" } },
          apns: {
            payload: { aps: { sound: "default", category: "status_update", priority: 10 }, notifee: { title: statusMessage.title, body: statusMessage.body } },
            headers: { "apns-push-type": "background", "apns-priority": "10" },
          },
        };
        deviceTokens.forEach(async ({ deviceToken }) => {
          try {
            await adminFirebase.messaging().send({ ...messagePayload, token: deviceToken });
          } catch (firebaseError) {
            console.error("Firebase error:", firebaseError);
            if (firebaseError.code === "messaging/registration-token-not-registered") {
              await FcmToken.destroy({ where: { deviceToken } });
              console.log(`Removed unregistered device token: ${deviceToken}`);
            }
          }
        });
      })
      .catch((err) => console.error("Failed to fetch device tokens:", err));

    await transaction.commit();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Status successfully changed! Notifications will be sent asynchronously.",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating status:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.block = async (req, res) => {
   const { id } = req.params;
    const { block } = req.body;
    const admin = req.user.id;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required",
      });
    }
    if (!block) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Block is required",
      });
    }
  const transaction = await sequelize.transaction();
  try {
   
    const existingBusiness = await MsmeInformation.findOne({ where: { id }, transaction });
    if (!existingBusiness) { return res.status(404).json({ status: "FAILURE", message: "The business does not exist.", }); }

    await MsmeInformation.update({ isBlocked: block }, { where: { id }, transaction });

    const business = await MsmeInformation.findOne({
      where: { id },
      attributes: ["userId", "businessRegistrationName"],
      transaction,
    });

    if (!business || !business.userId) throw new Error("No such user found in our database");

    const { userId, businessRegistrationName } = business;

    const user = await User.findOne({ where: { id: userId }, attributes: ["email"], transaction });
    if (!user || !user.email) throw new Error("User email not found");

    const email = user.email;
    const notificationMessage = block
      ? "Your business has been blocked due to a violation of our terms."
      : "Your business has been unblocked and is now visible again.";

    await Notification.create(
      {
        userId,
        title: block ? "Business Blocked" : "Business Unblocked",
        notification: notificationMessage,
        type: "Alert",
        priority: "High",
        createdAt: Date.now(),
        senderId: admin,
        viewed: false,
      },
      { transaction }
    );

    await transaction.commit();

    sendEmail({
      email,
      subject: `${businessRegistrationName} Has Been ${block ? "Blocked" : "Unblocked"}`,
      notification: block ? "blocked" : "unblocked",
    });

    FcmToken.findAll({ where: { userId }, attributes: ["deviceToken"] })
      .then((deviceTokens) => {
        if (!deviceTokens.length) return;

        const messagePayload = {
          notification: {
            title: block ? "Business Blocked" : "Business Unblocked",
            body: notificationMessage,
          },
          android: { priority: "high", notification: { sound: "default" } },
          apns: { headers: { "apns-priority": "10" }, payload: { aps: { sound: "default" } } },
        };

        deviceTokens.forEach(async ({ deviceToken }) => {
          try {
            await adminFirebase.messaging().send({ ...messagePayload, token: deviceToken });
          } catch (firebaseError) {
            console.error("Firebase error:", firebaseError);
            if (firebaseError.code === "messaging/registration-token-not-registered") {
              await FcmToken.destroy({ where: { deviceToken } });
              console.log(`Removed unregistered device token: ${deviceToken}`);
            }
          }
        });
      })
      .catch((err) => console.error("Failed to fetch device tokens:", err));

    return res.status(200).json({
      status: "SUCCESS",
      message: `Business successfully ${block ? "blocked" : "unblocked"}! Notifications will be sent asynchronously.`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Internal server error:", error.message);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
