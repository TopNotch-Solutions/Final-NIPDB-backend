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
  let newInformation;
  try {
    console.log(req.body);
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
    console.log("This is mondays recored: ", monday);
    //const { id } = req.user;
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
      "userId",
      "friday",
      "saturday",
      "sunday",
      "phoneNumber",
      "email",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          status: "FAILURE",
          message: `${field} is required.`,
        });
      }
    }

    businessRegistrationName = CapitalizeFirstLetter(businessRegistrationName);
    businessDisplayName = CapitalizeFirstLetter(businessDisplayName);
    typeOfBusiness = CapitalizeFirstLetter(typeOfBusiness);
    description = CapitalizeFirstLetter(description);
    region = CapitalizeFirstLetter(region);
    town = CapitalizeFirstLetter(town);
    primaryIndustry = CapitalizeFirstLetter(primaryIndustry);
    secondaryIndustry = CapitalizeFirstLetter(secondaryIndustry);
    founderName = CapitalizeFirstLetter(founderName);
    founderGender = CapitalizeFirstLetter(founderGender);
    businessAddress = CapitalizeFirstLetter(businessAddress);

    const checkExistingUser = await User.findOne({ where: { id: userId } });
    if (!checkExistingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "The user you are trying to insert into the database does not exist.",
      });
    }

    if (checkExistingUser.role !== "User") {
      return res.status(400).json({
        status: "FAILURE",
        message: "User does not have access to this route.",
      });
    }

    const alreadyExist = await MsmeInformation.findOne({
      where: { businessRegistrationName },
    });
    if (alreadyExist) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business name already in use.",
      });
    }
    const selectedRegion = await Region.findOne({
      where: {
        id: region,
      },
    });

    newInformation = await MsmeInformation.create({
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
    });

    await MsmeFounderInfo.create({
      businessId: newInformation.id,
      founderName,
      founderAge,
      founderGender,
    });

    await MsmeContactInfo.create({
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
    });

    // Handle image uploads and additional info
    const files = req.files;
    let businessLogo = files?.businessLogo
      ? files.businessLogo[0].filename
      : null;
    const image1 = files?.image1 ? files.image1[0].filename : null;
    const image2 = files?.image2 ? files.image2[0].filename : null;
    const image3 = files?.image3 ? files.image3[0].filename : null;

    if (!businessLogo) {
      const businessIcon = await PrimaryIndustry.findOne({
        where: {
          industryName: primaryIndustry,
        },
      });

      if (businessIcon && businessIcon.industryIcon) {
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

    await MsmeAdditionalInfo.create({
      businessId: newInformation.id,
      numberOfEmployees,
      businessLogo,
      image1,
      image2,
      image3,
    });

    await BusinessHour.create({
      businessId: newInformation.id,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    });

    // Notify admins
    const users = await Admin.findAll({
      attributes: ["id"],
    });
    if (!users) {
      return res.status(404).json({
        status: "FAILURE",
        message: "There are no users.",
      });
    }

    const userIds = users.map((user) => user.id);
    const notifications = userIds.map((userId) => ({
      userId,
      title: "New Business Application Submitted for Review",
      notification: `A new business application has been submitted. Please review the application details at your earliest convenience.`,
      type: "Alert",
      priority: "High",
      createdAt: Date.now(),
      viewed: false,
    }));
    await AdminNotification.bulkCreate(notifications);

    // Notify the user
    await Notification.create({
      userId,
      senderId: userId,
      title: "Application Successfully Submitted.",
      notification:
        "Your form has been submitted successfully. Admin will review your application and approve or decline your form. You will be sent another notification with the status of your application. Once your application is approved it will be added to the list of your businesses on the MSME profile and your business will be visible to all users. Remember you can always turn off visibility in your profile settings if you don't want people to see your business.",
      type: "Alert",
      priority: "High",
      createdAt: Date.now(),
      viewed: false,
    });

    // Send email notification
    await sendEmail(
      {
        email: checkExistingUser.email,
        subject: "Application to in4msme pending approval",
        notification: "pending",
      },
      res
    );

    res.status(201).json({
      status: "SUCCESS",
      message: "Business successfully created!",
    });
  } catch (error) {
    if (newInformation) {
      await MsmeInformation.destroy({ where: { id: newInformation.id } });
      await MsmeFounderInfo.destroy({
        where: { businessId: newInformation.id },
      });
      await MsmeContactInfo.destroy({
        where: { businessId: newInformation.id },
      });
      await MsmeAdditionalInfo.destroy({
        where: { businessId: newInformation.id },
      });
      await BusinessHour.destroy({ where: { businessId: newInformation.id } });
    }
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.allUser = async (req, res) => {
  try {
    const allUsers = await User.findAll({
      order: [["lastName", "ASC"]], // Assuming 'name' is the column you want to sort by
    });

    if (!allUsers) {
      return res.status(500).json({
        status: "FAILURE",
        message:
          "Something happened during the process of retrieving user data!",
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "All MSME information retrieved successfully!",
      data: allUsers,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.all = async (req, res) => {
  try {
    const allMsmeInformations = await MsmeInformation.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: MsmeFounderInfo,
          as: "founderInfo",
        },
        {
          model: MsmeContactInfo,
          as: "contactInfo",
        },
        {
          model: MsmeAdditionalInfo,
          as: "additionalInfo",
        },
        {
          model: BusinessHour,
          as: "businessHours",
        },
      ],
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "All MSME information retrieved successfully!",
      data: allMsmeInformations,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.allApproved = async (req, res) => {
  try {
    const allMsmeInformations = await MsmeInformation.findAll({
      where: {
        status: "Approved",
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: MsmeFounderInfo,
          as: "founderInfo",
        },
        {
          model: MsmeContactInfo,
          as: "contactInfo",
        },
        {
          model: MsmeAdditionalInfo,
          as: "additionalInfo",
        },
        {
          model: BusinessHour,
          as: "businessHours",
        },
      ],
    });
    const formattedData = allMsmeInformations.map((info) => {
      return {
        id: info.id,
        registrationName: info.businessRegistrationName,
        registrationNumber: info?.businessRegistrationNumber,
        displayName: info.businessDisplayName,
        typeOfBusiness: info.typeOfBusiness,
        description: info.description,
        annualTurnOver: info.annualTurnover,
        yearOfEstablishment: info.yearOfEstablishment,
        email: info.contactInfo?.email,
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
      };
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "All MSME information retrieved successfully!",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.allPending = async (req, res) => {
  try {
    const allMsmeInformations = await MsmeInformation.findAll({
      where: {
        status: "Pending",
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: MsmeFounderInfo,
          as: "founderInfo",
        },
        {
          model: MsmeContactInfo,
          as: "contactInfo",
        },
        {
          model: MsmeAdditionalInfo,
          as: "additionalInfo",
        },
        {
          model: BusinessHour,
          as: "businessHours",
        },
      ],
    });
    const formattedData = allMsmeInformations.map((info) => {
      return {
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
      };
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "All MSME information retrieved successfully!",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.allRejected = async (req, res) => {
  try {
    const allMsmeInformations = await MsmeInformation.findAll({
      where: {
        status: "Rejected",
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: MsmeFounderInfo,
          as: "founderInfo",
        },
        {
          model: MsmeContactInfo,
          as: "contactInfo",
        },
        {
          model: MsmeAdditionalInfo,
          as: "additionalInfo",
        },
        {
          model: BusinessHour,
          as: "businessHours",
        },
      ],
    });
    const formattedData = allMsmeInformations.map((info) => {
      return {
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
      };
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "All MSME information retrieved successfully!",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.allIncomplete = async (req, res) => {
  try {
    const allMsmeInformations = await MsmeInformation.findAll({
      where: {
        status: "Incomplete",
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: MsmeFounderInfo,
          as: "founderInfo",
        },
        {
          model: MsmeContactInfo,
          as: "contactInfo",
        },
        {
          model: MsmeAdditionalInfo,
          as: "additionalInfo",
        },
        {
          model: BusinessHour,
          as: "businessHours",
        },
      ],
    });
    const formattedData = allMsmeInformations.map((info) => {
      return {
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
      };
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "All MSME information retrieved successfully!",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.allBlocked = async (req, res) => {
  try {
    const allMsmeInformations = await MsmeInformation.findAll({
      where: {
        isBlocked: true,
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: MsmeFounderInfo,
          as: "founderInfo",
        },
        {
          model: MsmeContactInfo,
          as: "contactInfo",
        },
        {
          model: MsmeAdditionalInfo,
          as: "additionalInfo",
        },
        {
          model: BusinessHour,
          as: "businessHours",
        },
      ],
    });
    const formattedData = allMsmeInformations.map((info) => {
      return {
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
      };
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "All MSME information retrieved successfully!",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.single = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const msmeInformation = await MsmeInformation.findOne({
      where: {
        id,
      },
      include: [
        {
          model: MsmeFounderInfo,
          as: "founderInfo",
        },
        {
          model: MsmeContactInfo,
          as: "contactInfo",
        },
        {
          model: MsmeAdditionalInfo,
          as: "additionalInfo",
        },
        {
          model: BusinessHour,
          as: "businessHours",
        },
      ],
    });

    if (!msmeInformation) {
      return res.status(404).json({
        status: "FAILURE",
        message: "MSME information not found",
      });
    }
    let regionId;
    let migratedTown;
    if (msmeInformation.status !== "Incomplete") {
      regionId = await Region.findOne({
        where: {
          regionName: msmeInformation.region,
        },
      });
    } else {
      regionId = await Region.findOne({
        order: [["id", "ASC"]],
      });
      migratedTown = await Town.findOne({
        where: {
          regionId: regionId.id,
        },
      });
    }

    console.log(msmeInformation?.id);
    const newInformation = {
      id: msmeInformation?.id,
      businessRegistrationName: msmeInformation?.businessRegistrationName,
      businessRegistrationNumber: msmeInformation?.businessRegistrationNumber,
      businessDisplayName: msmeInformation?.businessDisplayName,
      typeOfBusiness: msmeInformation?.typeOfBusiness,
      description: msmeInformation?.description,
      region: parseInt(regionId.id),
      town:
        msmeInformation.status === "Incomplete"
          ? migratedTown
          : msmeInformation?.town,
      primaryIndustry: msmeInformation?.primaryIndustry,
      secondaryIndustry: msmeInformation?.secondaryIndustry,
      yearOfEstablishment: msmeInformation?.yearOfEstablishment,
      annualTurnover: msmeInformation?.annualTurnover,
      isVisibility: msmeInformation?.isVisibility,
      isBlocked: msmeInformation?.isBlocked,
      status: msmeInformation?.status,
      userId: msmeInformation?.userId,
      createdAt: msmeInformation?.createdAt,
      founderInfo: msmeInformation?.founderInfo,
      contactInfo: msmeInformation?.contactInfo,
      additionalInfo: msmeInformation?.additionalInfo,
      businessHours: msmeInformation?.businessHours,
    };
    console.log(msmeInformation);
    res.status(200).json({
      status: "SUCCESS",
      message: "MSME information retrieved successfully!",
      data: newInformation,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.singleMsme = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const msmeInformation = await MsmeInformation.findOne({
      where: {
        id,
      },
      include: [
        {
          model: MsmeFounderInfo,
          as: "founderInfo",
        },
        {
          model: MsmeContactInfo,
          as: "contactInfo",
        },
        {
          model: MsmeAdditionalInfo,
          as: "additionalInfo",
        },
        {
          model: BusinessHour,
          as: "businessHours",
        },
      ],
    });

    if (!msmeInformation) {
      return res.status(404).json({
        status: "FAILURE",
        message: "MSME information not found",
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "MSME information retrieved successfully!",
      data: msmeInformation,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.totalCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count();
    if (!totalCount) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Total count successfully retrieved!",
        count: totalCount,
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "Total count successfully retrieved!",
      count: totalCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.pendingCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count({
      where: {
        status: "Pending",
      },
    });
    console.log(totalCount);
    if (!totalCount) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Pending count successfully retrieved!",
        count: totalCount,
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "Pending count successfully retrieved!",
      count: totalCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.rejectedCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count({
      where: {
        status: "Rejected",
      },
    });
    console.log(totalCount);
    if (!totalCount) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Pending count successfully retrieved!",
        count: totalCount,
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "Rejected count successfully retrieved!",
      count: totalCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.incompleteCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count({
      where: {
        status: "Incomplete",
      },
    });
    console.log(totalCount);
    if (!totalCount) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Incomplete count successfully retrieved!",
        count: totalCount,
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "Incomplete count successfully retrieved!",
      count: totalCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.approvedCount = async (req, res) => {
  try {
    const totalCount = await MsmeInformation.count({
      where: {
        status: "Approved",
      },
    });
    if (!totalCount) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Pending count successfully retrieved!",
        count: totalCount,
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "Approved count successfully retrieved!",
      count: totalCount,
    });
  } catch (error) {
    res.status(500).json({
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
        [
          sequelize.fn("COUNT", sequelize.col("primaryIndustry")),
          "industryCount",
        ],
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

    if (topIndustries.length < 5) {
      const allIndustries = await MsmeInformation.findAll({
        attributes: ["primaryIndustry"],
        group: ["primaryIndustry"],
        order: [["primaryIndustry", "ASC"]],
      });

      const topIndustryNames = topIndustries.map(
        (industry) => industry.primaryIndustry
      );
      const missingIndustries = allIndustries
        .map((industry) => industry.primaryIndustry)
        .filter((name) => !topIndustryNames.includes(name))
        .slice(0, 5 - topIndustries.length);

      const finalIndustries = [
        ...topIndustries,
        ...missingIndustries.map((name) => ({
          primaryIndustry: name,
          industryCount: 0,
        })),
      ].slice(0, 5);

      return res.status(200).json({
        data: finalIndustries,
      });
    }

    return res.status(200).json({
      data: topIndustries,
    });
  } catch (error) {
    console.error("Error fetching top industries:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching top industries" });
  }
};
exports.montlyRegistration = async (req, res) => {
  try {
    const now = new Date(Date.now());
    const currentYear = now.getFullYear();
    const monthsData = [];

    for (let month = 1; month <= 12; month++) {
      const currentMonthCount = await MsmeInformation.count({
        where: {
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("YEAR", Sequelize.col("createdAt")),
              currentYear
            ),
            Sequelize.where(
              Sequelize.fn("MONTH", Sequelize.col("createdAt")),
              month
            ),
          ],
        },
      });

      const previousMonthCount = await MsmeInformation.count({
        where: {
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("YEAR", Sequelize.col("createdAt")),
              currentYear - 1
            ),
            Sequelize.where(
              Sequelize.fn("MONTH", Sequelize.col("createdAt")),
              month
            ),
          ],
        },
      });

      monthsData.push({
        date: `${currentYear}-${month.toString().padStart(2, "0")}`,
        currentMonth: currentMonthCount,
        previousMonth: previousMonthCount,
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Monthly registration data retrieved successfully!",
      data: monthsData,
    });
  } catch (error) {
    console.error("Error fetching monthly registration data:", error);
    return res.status(500).json({
      error: "An error occurred while fetching monthly registration data",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { businessId } = req.params;
    console.log(req.body);
    let businessLogo = null;

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
      removeImage1,
      removeImage2,
      removeImage3,
      removeImage,
    } = req.body;
    console.log(req.body);
    const business = await MsmeInformation.findOne({
      where: { id: businessId },
    });
    if (!business) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found.",
      });
    }

    if (businessRegistrationName !== business.businessRegistrationName) {
      const alreadyExist = await MsmeInformation.findOne({
        where: { businessRegistrationName },
      });
      if (alreadyExist) {
        return res.status(404).json({
          status: "FAILURE",
          message: "Business name already in use.",
        });
      }
    }

    const selectedRegion = await Region.findOne({
      where: {
        id: region,
      },
    });

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
      { where: { id: businessId } }
    );

    await MsmeFounderInfo.update(
      {
        founderName,
        founderAge,
        founderGender,
      },
      { where: { businessId } }
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
      { where: { businessId } }
    );

    const existing = await MsmeAdditionalInfo.findOne({
      where: { businessId },
    });

    if (removeImage) {
      const oldLogoPath = path.join("public", "msmes", existing.businessLogo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
      const businessIcon = await PrimaryIndustry.findOne({
        where: {
          industryName: primaryIndustry,
        },
      });

      if (businessIcon && businessIcon.industryIcon) {
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

        await MsmeAdditionalInfo.update(
          { businessLogo },
          { where: { businessId } }
        );
      }
    }

    if (req.files?.businessLogo && req.files.businessLogo[0].filename) {
      const businessLogo = req.files.businessLogo[0].filename;

      if (existing?.businessLogo) {
        const oldLogoPath = path.join("public", "msmes", existing.businessLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      await MsmeAdditionalInfo.update(
        { businessLogo },
        { where: { businessId } }
      );
    }

    await MsmeAdditionalInfo.update(
      { numberOfEmployees },
      { where: { businessId } }
    );

    if (removeImage1) {
      const existing = await MsmeAdditionalInfo.findOne({
        where: { businessId },
      });
      if (existing?.image1) {
        const oldImage1Path = path.join("public", "msmes", existing.image1);
        if (fs.existsSync(oldImage1Path)) {
          fs.unlinkSync(oldImage1Path);
        }
        await MsmeAdditionalInfo.update(
          { image1: null },
          { where: { businessId } }
        );
      }
    }
    if (req.files?.image1) {
      const newImage1 = req.files.image1[0].filename;

      if (existing?.image1) {
        const oldImage1Path = path.join("public", "msmes", existing.image1);
        if (fs.existsSync(oldImage1Path)) {
          fs.unlinkSync(oldImage1Path);
        }
      }

      await MsmeAdditionalInfo.update(
        { image1: newImage1 },
        { where: { businessId } }
      );
    }

    if (removeImage2) {
      const existing = await MsmeAdditionalInfo.findOne({
        where: { businessId },
      });
      if (existing?.image2) {
        const oldImage2Path = path.join("public", "msmes", existing.image2);
        if (fs.existsSync(oldImage2Path)) {
          fs.unlinkSync(oldImage2Path);
        }
        await MsmeAdditionalInfo.update(
          { image2: null },
          { where: { businessId } }
        );
      }
    }
    if (req.files?.image2) {
      const newImage2 = req.files.image2[0].filename;

      if (existing?.image2) {
        const oldImage2Path = path.join("public", "msmes", existing.image2);
        if (fs.existsSync(oldImage2Path)) {
          fs.unlinkSync(oldImage2Path);
        }
      }

      await MsmeAdditionalInfo.update(
        { image2: newImage2 },
        { where: { businessId } }
      );
    }

    if (removeImage3) {
      const existing = await MsmeAdditionalInfo.findOne({
        where: { businessId },
      });
      if (existing?.image3) {
        const oldImage3Path = path.join("public", "msmes", existing.image3);
        if (fs.existsSync(oldImage3Path)) {
          fs.unlinkSync(oldImage3Path);
        }
        await MsmeAdditionalInfo.update(
          { image3: null },
          { where: { businessId } }
        );
      }
    }
    if (req.files?.image3) {
      const newImage3 = req.files.image3[0].filename;

      if (existing?.image3) {
        const oldImage3Path = path.join("public", "msmes", existing.image3);
        if (fs.existsSync(oldImage3Path)) {
          fs.unlinkSync(oldImage3Path);
        }
      }

      await MsmeAdditionalInfo.update(
        { image3: newImage3 },
        { where: { businessId } }
      );
    }

    await BusinessHour.update(
      {
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
      },
      { where: { businessId } }
    );

    res.status(200).json({
      status: "SUCCESS",
      message: "Business successfully updated!",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.status = async (req, res) => {
  try {
    let id = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    id = parseInt(id);
    console.log(id, status, userId);
    if (!id || !status) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const existingUser = await Admin.findOne({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The user you are trying to access does not exist.",
      });
    }

    const existingBusiness = await MsmeInformation.findOne({
      where: {
        id,
      },
    });

    if (!existingBusiness) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business does not exist.",
      });
    }
    const user = await User.findOne({
      where: {
        id: existingBusiness.userId,
      },
    });
    if (!user) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business does not exist.",
      });
    }
    await MsmeInformation.update(
      { status },
      {
        where: {
          id,
        },
      }
    );
    if (status === "Approved") {
      await Notification.create({
        userId: existingBusiness.userId,
        title: "Approved - Welcome to in4msme",
        notification: `Dear Entrepreneur,\nWe are pleased to inform you that your account has been approved! You can access your account and your business’ profile is now publicly visible to potential customers, investors and business support organisations.  You can choose to hide your profile in your account settings, which means only NIPDB can see your profile.\nIf you have any questions, please do not hesitate to contact us at msme.eo@nipdb.com\nKind Regards,\nNIPDB`,
        type: "Alert",
        priority: "High",
        createdAt: Date.now(),
        senderId: userId,
        viewed: false,
      });
      await sendEmail(
        {
          email: user.email,
          subject: "Account Approved - Welcome to in4msme",
          notification: "approved",
        },
        res
      );

      const allUserDeviceTokens = await FcmToken.findAll({
        where: {
          userId: existingBusiness.userId,
        },
        attributes: ["deviceToken"],
      });
      if (allUserDeviceTokens.length > 0) {
        const message = {
          notification: {
            title: "Approved - Welcome to in4msme",
            body: `Dear Entrepreneur,\nWe are pleased to inform you that your account has been approved! You can access your account and your business’ profile is now publicly visible to potential customers, investors and business support organisations.  You can choose to hide your profile in your account settings, which means only NIPDB can see your profile.\nIf you have any questions, please do not hesitate to contact us at msme.eo@nipdb.com\nKind Regards,\nNIPDB`,
          },
          data:{
            title: "Approved - Welcome to in4msme",
            body: `Dear Entrepreneur,\nWe are pleased to inform you that your account has been approved! You can access your account and your business’ profile is now publicly visible to potential customers, investors and business support organisations.  You can choose to hide your profile in your account settings, which means only NIPDB can see your profile.\nIf you have any questions, please do not hesitate to contact us at msme.eo@nipdb.com\nKind Regards,\nNIPDB`,
            type: 'status_update',
            click_action: 'NOTIFICATION_CLICK',
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "default-channel-id",
              priority: "high",
              visibility: "public",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                category: 'status_update',
                priority: 10
              },
              notifee: {
                title: "Approved - Welcome to in4msme",
             body: `Dear Entrepreneur,\nWe are pleased to inform you that your account has been approved! You can access your account and your business’ profile is now publicly visible to potential customers, investors and business support organisations.  You can choose to hide your profile in your account settings, which means only NIPDB can see your profile.\nIf you have any questions, please do not hesitate to contact us at msme.eo@nipdb.com\nKind Regards,\nNIPDB`,
              }
            },
            headers: {
              "apns-push-type": "background",
              "apns-priority": "10",
            },
          },
        };

        const firebasePromises = allUserDeviceTokens.map(
          async ({ deviceToken }) => {
            try {
              return await adminFirebase
                .messaging()
                .send({ ...message, token: deviceToken });
            } catch (firebaseError) {
              console.error("Firebase error:", firebaseError);

              if (
                firebaseError.code ===
                "messaging/registration-token-not-registered"
              ) {
                await FcmToken.destroy({
                  where: { deviceToken },
                });
                console.log(
                  `Removed unregistered device token: ${deviceToken}`
                );
              } else {
                throw firebaseError; // Rethrow error if it's not token-related
              }
            }
          }
        );

        try {
          await Promise.all(firebasePromises);
          res.status(200).json({
            status: "SUCCESS",
            message: "Notification sent to user's devices successfully.",
          });
        } catch (error) {
          res.status(500).json({
            status: "FAILURE",
            message: "Failed to send some notifications: " + error.message,
          });
        }
      }
    } else {
      await Notification.create({
        userId: existingBusiness.userId,
        title: "Application to in4msme declined",
        notification: `Dear Entrepreneur,\nWe regret to inform you that your application to the in4msme app was unsuccessful. Possible reasons for this decision may include:\n 1.	False or Incorrect information\n2.	Inconsistencies in the provided information\n3.	Non-compliance with the criteria\n4.	Violations of terms or policies\nPlease review the feedback provided and feel free to reapply.\nIf you have any questions regarding your application please contact msme.eo@nipdb.com or call 083 333 8619.\nKind regards,\nNIPDB`,
        type: "Alert",
        priority: "High",
        createdAt: Date.now(),
        senderId: userId,
        viewed: false,
      });
      await sendEmail(
        {
          email: user.email,
          subject: "Application to in4msme declined",
          notification: "rejected",
        },
        res
      );

      const allUserDeviceTokens = await FcmToken.findAll({
        where: {
          userId: existingBusiness.userId,
        },
        attributes: ["deviceToken"],
      });
      if (allUserDeviceTokens.length > 0) {
        const message = {
          notification: {
            title: "Application to in4msme declined",
            body: `Dear Entrepreneur,\nWe regret to inform you that your application to the in4msme app was unsuccessful. Possible reasons for this decision may include:\n 1.	False or Incorrect information\n2.	Inconsistencies in the provided information\n3.	Non-compliance with the criteria\n4.	Violations of terms or policies\nPlease review the feedback provided and feel free to reapply.\nIf you have any questions regarding your application please contact msme.eo@nipdb.com or call 083 333 8619.\nKind regards,\nNIPDB`,
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
            },
          },
          apns: {
            headers: {
              "apns-priority": "10",
            },
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
        };

        const firebasePromises = allUserDeviceTokens.map(
          async ({ deviceToken }) => {
            try {
              return await adminFirebase
                .messaging()
                .send({ ...message, token: deviceToken });
            } catch (firebaseError) {
              console.error("Firebase error:", firebaseError);

              if (
                firebaseError.code ===
                "messaging/registration-token-not-registered"
              ) {
                await FcmToken.destroy({
                  where: { deviceToken },
                });
                console.log(
                  `Removed unregistered device token: ${deviceToken}`
                );
              } else {
                throw firebaseError; // Rethrow error if it's not token-related
              }
            }
          }
        );

        try {
          await Promise.all(firebasePromises);
          res.status(200).json({
            status: "SUCCESS",
            message: "Notification sent to user's devices successfully.",
          });
        } catch (error) {
          res.status(500).json({
            status: "FAILURE",
            message: "Failed to send some notifications: " + error.message,
          });
        }
      }
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "Status successfully changed!",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.block = async (req, res) => {
  try {
    const { id } = req.params;
    const { block } = req.body;
    const admin = req.user.id;
    console.log("Received Request:", { id, block, admin });

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const existingBusiness = await MsmeInformation.findOne({ where: { id } });

    if (!existingBusiness) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business does not exist.",
      });
    }

    await MsmeInformation.update({ isBlocked: block }, { where: { id } });

    const business = await MsmeInformation.findOne({
      where: { id },
      attributes: ["userId", "businessRegistrationName"],
    });

    if (!business || !business.userId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "No such user found in our database",
      });
    }

    const { userId, businessRegistrationName } = business;
    console.log("User ID:", userId);

    const user = await User.findOne({
      where: { id: userId },
      attributes: ["email"],
    });

    if (!user || !user.email) {
      return res.status(404).json({
        status: "FAILURE",
        message: "User email not found",
      });
    }

    const email = user.email;
    console.log("User Email:", email);

    const notificationMessage = block
      ? "Your business has been blocked due to a violation of our terms."
      : "Your business has been unblocked and is now visible again.";

    await Notification.create({
      userId,
      title: block ? "Business Blocked" : "Business Unblocked",
      notification: notificationMessage,
      type: "Alert",
      priority: "High",
      createdAt: Date.now(),
      senderId: admin,
      viewed: false,
    });

    const allUserDeviceTokens = await FcmToken.findAll({
      where: { userId },
      attributes: ["deviceToken"],
    });
    console.log("user device token: ",allUserDeviceTokens)

    if (allUserDeviceTokens.length > 0) {
      const message = {
        notification: {
          title: block ? "Business Blocked" : "Business Unblocked",
          body: notificationMessage,
        },
        android: {
          priority: "high",
          notification: { sound: "default" },
        },
        apns: {
          headers: { "apns-priority": "10" },
          payload: { aps: { sound: "default" } },
        },
      };

      const firebasePromises = allUserDeviceTokens.map(async ({ deviceToken }) => {
        try {
          return await adminFirebase.messaging().send({ ...message, token: deviceToken });
        } catch (firebaseError) {
          console.error("Firebase error:", firebaseError);
          if (firebaseError.code === "messaging/registration-token-not-registered") {
            await FcmToken.destroy({ where: { deviceToken } });
            console.log(`Removed unregistered device token: ${deviceToken}`);
          } else {
            throw firebaseError;
          }
        }
      });

      try {
        console.log("Sending push notification...");
        await Promise.all(firebasePromises);
      } catch (error) {
        console.error("Failed to send notifications:", error.message);
      }
    }

    console.log("Sending email to user...");
    await sendEmail(
      {
        email,
        subject: `${businessRegistrationName} Has Been ${block ? "Blocked" : "Unblocked"}`,
        notification: block ? "blocked" : "unblocked",
      },
      res
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: `Business successfully ${block ? "blocked" : "unblocked"}!`,
    });
  } catch (error) {
    console.error("Internal server error:", error.message);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
