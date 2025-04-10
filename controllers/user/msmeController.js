const MsmeInformation = require("../../models/msmeInformation");
const MsmeFounderInfo = require("../../models/msmeFounder");
const MsmeContactInfo = require("../../models/msmeContactInfo");
const MsmeAdditionalInfo = require("../../models/msmeAdditionalInfo");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const User = require("../../models/user");
const { where, Op } = require("sequelize");
const Notification = require("../../models/notification");
const Favourite = require("../../models/msmeLike");
const Admin = require("../../models/admin");
const AdminNotification = require("../../models/adminNotifications");
const BusinessHour = require("../../models/businessHour");
const PrimaryIndustry = require("../../models/primaryIndustry");
const SecondaryIndustry = require("../../models/secondaryIndustry");
const Region = require("../../models/region");
const Town = require("../../models/town");
const sendEmail = require("../../utils/mobile/sendEmail");
const fs = require("fs");
const path = require("path");

exports.create = async (req, res) => {
  let newInformation;
  try {
    const files = req.files;
    let businessLogo = files.businessLogo
      ? files.businessLogo[0].filename
      : null;
    const image1 = files.image1 ? files.image1[0].filename : null;
    const image2 = files.image2 ? files.image2[0].filename : null;
    const image3 = files.image3 ? files.image3[0].filename : null;
    const { id } = req.user;
    let {
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
      linkedIn,
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

    const checkExistingUser = await User.findOne({ where: { id } });
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
      return res.status(409).json({
        status: "FAILURE",
        message: "Business name already in use.",
      });
    }

    newInformation = await MsmeInformation.create({
      businessRegistrationName,
      businessDisplayName,
      businessAddress,
      typeOfBusiness,
      description,
      region,
      town,
      businessRegistrationNumber,
      primaryIndustry,
      secondaryIndustry,
      yearOfEstablishment,
      annualTurnover,
      userId: id,
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
      linkedIn,
    });

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

    const users = await Admin.findAll({ attributes: ["id"] });
    const userIds = users.map((user) => user.id);
    const notifications = userIds.map((userId) => ({
      userId,
      title: `${businessRegistrationName} Business Application Submitted for Review`,
      notification: `${businessDisplayName} business application has been submitted by ${checkExistingUser.firstName} ${checkExistingUser.lastName}. Please review the application details at your earliest convenience.`,
      type: "Alert",
      priority: "High",
      createdAt: Date.now(),
      viewed: false,
    }));

    await AdminNotification.bulkCreate(notifications);
    await Notification.create({
      userId: id,
      title: "Application Successfully Submitted.",
      notification:
        "Your form has been submitted successfully. Admin will review your application and approve or decline your form. You will be sent another notification with the status of your application. Once your application is approved it will be added to the list of your businesses on the msme profile and your business will be visible to all users. Remember, you can always turn off visibility in your profile settings if you don’t want people to see your business.",
      type: "Alert",
      priority: "High",
      createdAt: Date.now(),
      senderId: id,
      viewed: false,
    });

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

exports.like = async (req, res) => {
  try {
    let userId = req.user.id;
    let { businessId } = req.params;

    if (!userId || !businessId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }
    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (!existingUser) {
      return res.status(409).json({
        status: "FAILURE",
        message: "userId provided does not exist!",
      });
    }
    const existingBusiness = await MsmeInformation.findOne({
      where: {
        id: businessId,
      },
    });
    if (!existingBusiness) {
      return res.status(409).json({
        status: "FAILURE",
        message: "businessId provided does not exist!",
      });
    }
    const alreadyLike = await Favourite.findOne({
      where: {
        userId,
        businessId,
      },
    });
    if (alreadyLike) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business already added to favourite!",
      });
    }
    await Favourite.create({
      userId,
      businessId,
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "Business successfully added to favourite!",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.unlike = async (req, res) => {
  try {
    let userId = req.user.id;
    let { businessId } = req.params;

    if (!userId || !businessId) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }
    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (!existingUser) {
      return res.status(409).json({
        status: "FAILURE",
        message: "userId provided does not exist!",
      });
    }
    const existingBusiness = await MsmeInformation.findOne({
      where: {
        id: businessId,
      },
    });
    if (!existingBusiness) {
      return res.status(409).json({
        status: "FAILURE",
        message: "UserId and businessId provided does not exist!",
      });
    }
    const alreadyLike = await Favourite.findOne({
      where: {
        userId,
        businessId,
      },
    });
    if (!alreadyLike) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not added to favourite!",
      });
    }
    await Favourite.destroy({
      where: {
        userId,
        businessId,
      },
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "Business successfully removed from favourite!",
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
      where: {
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
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
exports.filterByIndustry = async (req, res) => {
  try {
    const { industryName } = req.params;
    if (!industryName) {
      return res
        .status(400)
        .json({ error: "Industry name parameter is required" });
    }
    const checkPrimaryExist = await PrimaryIndustry.findOne({
      where: {
        industryName,
      },
    });
    const checkSecondaryExist = await SecondaryIndustry.findOne({
      where: {
        industryName,
      },
    });

    if (!checkPrimaryExist && !checkSecondaryExist) {
      return res
        .status(400)
        .json({ error: "Industry name provided does not exist!" });
    }
    const allMsmeInformations = await MsmeInformation.findAll({
      where: {
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
        [Op.or]: [
          {
            primaryIndustry: industryName,
          },
          {
            secondaryIndustry: industryName,
          },
        ],
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
exports.recentlyAdded = async (req, res) => {
  try {
    const allMsmeInformations = await MsmeInformation.findAll({
      where: {
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
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
      order: [["createdAt", "DESC"]],
      limit: 7,
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

exports.allRegionBusiness = async (req, res) => {
  try {
    let { region } = req.params;
    if (!region) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter: region.",
      });
    }
    const isRegion = await Region.findOne({
      where: {
        regionName: region,
      },
    });
    if (!isRegion) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The provided region does not exist.",
      });
    }
    const allMsmeInformations = await MsmeInformation.findAll({
      where: {
        region,
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
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

exports.allTownBusiness = async (req, res) => {
  try {
    let { townName } = req.body;
    if (!townName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter: region.",
      });
    }
    const isTown = await Town.findOne({
      where: {
        townName,
      },
    });
    if (!isTown) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The provided town does not exist.",
      });
    }
    const allMsmeInformations = await MsmeInformation.findAll({
      where: {
        town: townName,
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
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
exports.allLiked = async (req, res) => {
  try {
    let userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter: userId.",
      });
    }

    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist.",
      });
    }

    const likedBusinesses = await Favourite.findAll({
      where: {
        userId,
      },
      attributes: ["businessId"],
    });

    const businessIds = likedBusinesses.map((like) => like.businessId);

    if (businessIds.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The user has not liked any businesses.",
      });
    }

    const businesses = await MsmeInformation.findAll({
      where: {
        id: businessIds,
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
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

    if (businesses.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "No businesses found in MsmeInformation table for the liked business IDs.",
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "All MSME information retrieved successfully!",
      data: businesses,
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.isBusinessLiked = async (req, res) => {
  try {
    let userId = req.user.id;
    let { businessId } = req.params;

    if (!userId || !businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }

    const isLiked = await Favourite.findOne({
      where: { userId, businessId },
    });

    res.status(200).json({
      status: "SUCCESS",
      message: "Business like status retrieved successfully!",
      data: { isLiked: !!isLiked },
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.isVisible = async (req, res) => {
  try {
    const { id } = req.user;
    const { businessId } = req.params;

    if (!id || !businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameters.",
      });
    }

    const business = await MsmeInformation.findOne({
      where: { userId: id, id: businessId },
    });

    if (!business) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found.",
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Business visibility status retrieved successfully!",
      data: business.isVisibility,
    });
  } catch (error) {
    console.error("Error retrieving business visibility:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.allSingleUserMsme = async (req, res) => {
  try {
    const id = req.user.id;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const msmeInformation = await MsmeInformation.findAll({
      where: {
        userId: id,
        status: {
          [Op.not]: "Pending",
        },
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
exports.single = async (req, res) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const msmeInformation = await MsmeInformation.findOne({
      where: {
        id: businessId,
        status: "Approved",
        isBlocked: false,
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
exports.singleRejected = async (req, res) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const msmeInformation = await MsmeInformation.findOne({
      where: {
        id: businessId,
        [Op.or]: [
          { status: "Rejected",}, 
          { status: "Incomplete",},
        ] 
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

exports.update = async (req, res) => {
  try {
    const { businessId } = req.params;
    let businessLogo = null;
    let {
      numberOfEmployees,
      businessDisplayName,
      businessRegistrationName,
      businessRegistrationNumber,
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
      removeImage1,
      removeImage2,
      removeImage3,
      removeImage,
    } = req.body;
    console.log(req.body);
    const business = await MsmeInformation.findOne({
      where: {
        id: businessId,
      },
    });
    if (!business) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found.",
      });
    }

    if(businessRegistrationName){
      if (businessRegistrationName !== business.businessRegistrationName) {
        const alreadyExist = await MsmeInformation.findOne({
          where: { businessRegistrationName },
        });
        if (alreadyExist) {
          return res.status(404).json({
            status: "FAILURE",
            message: "Business registration name already in use.",
          });
        }
      }
    }

    if(businessRegistrationNumber){
      if (businessRegistrationNumber !== business.businessRegistrationNumber) {
        const alreadyExist = await MsmeInformation.findOne({
          where: { businessRegistrationNumber },
        });
        if (alreadyExist) {
          return res.status(404).json({
            status: "FAILURE",
            message: "Business registration number already in use.",
          });
        }
      }
    }

    await MsmeInformation.update(
      {
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

    const existing = await MsmeInformation.findOne({
      where: { id: businessId },
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
        { businessLogo, numberOfEmployees },
        { where: { businessId } }
      );
    }

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
    if (existing.status === "Rejected" || existing.status === "Incomplete") {
      await MsmeInformation.update(
        {
          status: "Pending",
        },
        {
          where: {
            id: businessId,
          },
        }
      );
    }
    const newUpdate = await MsmeInformation.findOne({
      where: {
        id: businessId,
      },
    });
    console.log(newUpdate);
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

exports.updateTest = async (req, res) => {
  try {
    const { businessId } = req.params;
    const {
      businessRegistrationName,
      businessRegistrationNumber,
      numberOfEmployees,
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
    } = req.body;
    console.log(req.body);
    res.status(200).json({
      status: "Success",
      message: "Success",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.updateLogo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessId } = req.params;

    if (!businessId || !userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const checkExistingUser = await User.findOne({
      where: { id: userId },
    });

    if (!checkExistingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "User trying to access this resource does not exist on the system.",
      });
    }
    const existing = await MsmeAdditionalInfo.findOne({
      where: { businessId },
    });

    if (!existing) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business resource does not exist on the system.",
      });
    }

    if (req.file) {
      const businessLogo = req.file.filename;

      if (existing.businessLogo) {
        const oldLogoPath = path.join("public", "msmes", existing.businessLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      await MsmeAdditionalInfo.update(
        { businessLogo },
        {
          where: { businessId },
        }
      );
      if (existing.status === "Rejected" || existing.status === "Incomplete") {
        await MsmeInformation.update(
          {
            status: "Pending",
          },
          {
            where: {
              id: businessId,
            },
          }
        );
      }
      return res.status(200).json({
        status: "SUCCESS",
        message: "Business logo successfully updated",
      });
    } else {
      return res.status(400).json({
        status: "FAILURE",
        message: "No business logo was uploaded",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.updateImage1 = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessId } = req.params;

    if (!businessId || !userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const checkExistingUser = await User.findOne({
      where: { id: userId },
    });

    if (!checkExistingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "User trying to access this resource does not exist on the system.",
      });
    }

    const existing = await MsmeAdditionalInfo.findOne({
      where: { businessId },
    });

    if (!existing) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business resource does not exist on the system.",
      });
    }

    if (req.file) {
      const image1 = req.file.filename;

      if (existing.image1) {
        const oldImagePath = path.join("public", "msmes", existing.image1);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      await MsmeAdditionalInfo.update(
        { image1 },
        {
          where: { businessId },
        }
      );
      if (existing.status === "Rejected" || existing.status === "Incomplete") {
        await MsmeInformation.update(
          {
            status: "Pending",
          },
          {
            where: {
              id: businessId,
            },
          }
        );
      }
      return res.status(200).json({
        status: "SUCCESS",
        message: "Image 1 picture updated",
      });
    } else {
      return res.status(400).json({
        status: "FAILURE",
        message: "No image1 was uploaded",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.updateImage2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessId } = req.params;

    if (!businessId || !userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const checkExistingUser = await User.findOne({
      where: { id: userId },
    });

    if (!checkExistingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "User trying to access this resource does not exist on the system.",
      });
    }

    const existing = await MsmeAdditionalInfo.findOne({
      where: { businessId },
    });

    if (!existing) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business resource does not exist on the system.",
      });
    }

    if (req.file) {
      const image2 = req.file.filename;

      if (existing.image2) {
        const oldImagePath = path.join("public", "msmes", existing.image2);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      await MsmeAdditionalInfo.update(
        { image2 },
        {
          where: { businessId },
        }
      );
      if (existing.status === "Rejected" || existing.status === "Incomplete") {
        await MsmeInformation.update(
          {
            status: "Pending",
          },
          {
            where: {
              id: businessId,
            },
          }
        );
      }
      return res.status(200).json({
        status: "SUCCESS",
        message: "Image 2 picture updated",
      });
    } else {
      return res.status(400).json({
        status: "FAILURE",
        message: "No image2 was uploaded",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.updateImage3 = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessId } = req.params;

    if (!businessId || !userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const checkExistingUser = await User.findOne({
      where: { id: userId },
    });

    if (!checkExistingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "User trying to access this resource does not exist on the system.",
      });
    }

    const existing = await MsmeAdditionalInfo.findOne({
      where: { businessId },
    });

    if (!existing) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business resource does not exist on the system.",
      });
    }

    if (req.file) {
      const image3 = req.file.filename;

      if (existing.image3) {
        const oldImagePath = path.join("public", "msmes", existing.image3);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      await MsmeAdditionalInfo.update(
        { image3 },
        {
          where: { businessId },
        }
      );
      if (existing.status === "Rejected" || existing.status === "Incomplete") {
        await MsmeInformation.update(
          {
            status: "Pending",
          },
          {
            where: {
              id: businessId,
            },
          }
        );
      }
      return res.status(200).json({
        status: "SUCCESS",
        message: "Image 3 picture updated",
      });
    } else {
      return res.status(400).json({
        status: "FAILURE",
        message: "No image3 was uploaded",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.businessHours = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessId } = req.params;
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } =
      req.body;
    if (!businessId || !userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }
    const checkExistingUser = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!checkExistingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "User trying to access this resource does not exist on the system.",
      });
    }
    const existing = await MsmeAdditionalInfo.findOne({
      where: {
        businessId,
      },
    });
    if (!existing) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business resource does not exist on the system.",
      });
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
      {
        where: {
          businessId,
        },
      }
    );
    if (existing.status === "Rejected") {
      await MsmeInformation.update(
        {
          status: "Pending",
        },
        {
          where: {
            id: businessId,
          },
        }
      );
    }
    res.status(200).json({
      status: "SUCCESS",
      message: "Image 3 picture updated",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.delete = async (req, res) => {
  try {
    const id = req.user.id;
    const { businessId } = req.params;

    if (!businessId || !id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }
    const checkExistingUser = await User.findOne({ where: { id } });

    if (!checkExistingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "User trying to access this resource does not exist on the system.",
      });
    }

    const checkBusiness = await MsmeInformation.findOne({
      where: { id: businessId },
    });

    if (!checkBusiness) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business does not exist on the system.",
      });
    }

    const { businessLogo, image1, image2, image3 } = checkBusiness;

    const imagePaths = [businessLogo, image1, image2, image3];

    imagePaths.forEach((imagePath) => {
      if (imagePath) {
        const fullPath = path.join("public", "msmes", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    });

    await MsmeInformation.destroy({ where: { id: businessId } });
    await MsmeFounderInfo.destroy({ where: { businessId } });
    await MsmeContactInfo.destroy({ where: { businessId } });
    await MsmeAdditionalInfo.destroy({ where: { businessId } });
    await BusinessHour.destroy({ where: { businessId } });

    res.status(200).json({
      status: "SUCCESS",
      message: "Business and associated images successfully deleted!",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.visibility = async (req, res) => {
  try {
    const id = req.user.id;
    const { businessId, visibility } = req.body;

    if (!businessId || !id) {
      return res.status(400).json({
        status: "FAILURE",
        message: `Empty parameter,${businessId}${visibility}${id}`,
      });
    }
    const checkExistingUser = await User.findOne({
      where: {
        id,
      },
    });

    if (!checkExistingUser) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "User trying to access this resource does not exist on the system.",
      });
    }
    const checkBusiness = await MsmeInformation.findOne({
      where: {
        id: businessId,
      },
    });
    if (!checkBusiness) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business does not exist on the system.",
      });
    }
    await MsmeInformation.update(
      {
        isVisibility: visibility,
      },
      {
        where: {
          id: businessId,
        },
      }
    );
    res.status(200).json({
      status: "SUCCESS",
      message: "Visibility successfully updated!",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
