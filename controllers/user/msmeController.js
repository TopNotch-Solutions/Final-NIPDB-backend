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
const sequelize = require("../../config/dbConfig");

exports.create = async (req, res) => {
  const { id } = req.user;
    const files = req.files || {};

    let businessLogo = files.businessLogo?.[0]?.filename || null;
    const image1 = files.image1?.[0]?.filename || null;
    const image2 = files.image2?.[0]?.filename || null;
    const image3 = files.image3?.[0]?.filename || null;

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
  const transaction = await sequelize.transaction();

  try {

    const capitalizeFields = [
      "businessRegistrationName",
      "businessDisplayName",
      "typeOfBusiness",
      "description",
      "region",
      "town",
      "primaryIndustry",
      "secondaryIndustry",
      "founderName",
      "founderGender",
      "businessAddress",
    ];

    capitalizeFields.forEach((field) => {
      if (req.body[field]) {
        req.body[field] = CapitalizeFirstLetter(req.body[field]);
      }
    });

    ({
      businessRegistrationName,
      businessDisplayName,
      typeOfBusiness,
      description,
      region,
      town,
      primaryIndustry,
      secondaryIndustry,
      founderName,
      founderGender,
      businessAddress,
    } = req.body);

    const checkExistingUser = await User.findOne({
      where: { id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!checkExistingUser) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist.",
      });
    }

    if (checkExistingUser.role !== "User") {
      await transaction.rollback();
      return res.status(403).json({
        status: "FAILURE",
        message: "User does not have access to this route.",
      });
    }

    const alreadyExist = await MsmeInformation.findOne({
      where: { businessRegistrationName },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (alreadyExist) {
      await transaction.rollback();
      return res.status(409).json({
        status: "FAILURE",
        message: "Business name already in use.",
      });
    }

    const newBusiness = await MsmeInformation.create(
      {
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
      },
      { transaction }
    );

    await MsmeFounderInfo.create(
      {
        businessId: newBusiness.id,
        founderName,
        founderAge,
        founderGender,
      },
      { transaction }
    );

    await MsmeContactInfo.create(
      {
        businessId: newBusiness.id,
        businessAddress,
        phoneNumber,
        whatsAppNumber,
        email,
        website,
        twitter,
        facebook,
        instagram,
        linkedIn,
      },
      { transaction }
    );

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
        businessId: newBusiness.id,
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
        businessId: newBusiness.id,
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

    const admins = await Admin.findAll(
      { attributes: ["id"] },
      { transaction }
    );

    const adminNotifications = admins.map((admin) => ({
      userId: admin.id,
      title: `${businessRegistrationName} Business Application Submitted for Review`,
      notification: `${businessDisplayName} application submitted by ${checkExistingUser.firstName} ${checkExistingUser.lastName}.`,
      type: "Alert",
      priority: "High",
      viewed: false,
    }));

    await AdminNotification.bulkCreate(adminNotifications, { transaction });

    await Notification.create(
      {
        userId: id,
        title: "Application Successfully Submitted.",
        notification:
          "Your application has been submitted successfully. You will be notified once it is reviewed.",
        type: "Alert",
        priority: "High",
        senderId: id,
        viewed: false,
      },
      { transaction }
    );

    await transaction.commit();
    await sendEmail({
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

    console.error("Create Business Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};


exports.like = async (req, res) => {
  const userId = req.user?.id;
    const { businessId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
     if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {

    const existingUser = await User.findOne({
      where: { id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!existingUser) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist.",
      });
    }

    const existingBusiness = await MsmeInformation.findOne({
      where: { id: businessId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!existingBusiness) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Business does not exist.",
      });
    }

    const alreadyLike = await Favourite.findOne({
      where: { userId, businessId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (alreadyLike) {
      await transaction.rollback();
      return res.status(409).json({
        status: "FAILURE",
        message: "Business already added to favourites.",
      });
    }

    await Favourite.create(
      {
        userId,
        businessId,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business successfully added to favourites.",
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Like Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.unlike = async (req, res) => {
  const userId = req.user?.id;
    const { businessId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
     if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {
    const existingUser = await User.findOne({
      where: { id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!existingUser) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist.",
      });
    }

    const existingBusiness = await MsmeInformation.findOne({
      where: { id: businessId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!existingBusiness) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Business does not exist.",
      });
    }

    const favourite = await Favourite.findOne({
      where: { userId, businessId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!favourite) {
      await transaction.rollback();
      return res.status(409).json({
        status: "FAILURE",
        message: "Business is not in favourites.",
      });
    }

    await favourite.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business successfully removed from favourites.",
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Unlike Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.all = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {

    const { count, rows } = await MsmeInformation.findAndCountAll({
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
      limit,
      offset,
      distinct: true,
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "MSME information retrieved successfully.",
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
      data: rows,
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Fetch MSME Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.filterByIndustry = async (req, res) => {
  const { industryName } = req.params;

    if (!industryName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Industry name parameter is required.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
    
    const normalizedIndustry = industryName.trim();

    const [primaryExist, secondaryExist] = await Promise.all([
      PrimaryIndustry.findOne({
        where: { industryName: normalizedIndustry },
        transaction,
      }),
      SecondaryIndustry.findOne({
        where: { industryName: normalizedIndustry },
        transaction,
      }),
    ]);

    if (!primaryExist && !secondaryExist) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry name provided does not exist.",
      });
    }

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
        [Op.or]: [
          { primaryIndustry: normalizedIndustry },
          { secondaryIndustry: normalizedIndustry },
        ],
      },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Filtered MSME information retrieved successfully.",
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
      data: rows,
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Filter By Industry Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};


exports.recentlyAdded = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
    const limit = parseInt(req.query.limit) || 7;

    const recentlyAddedMsmes = await MsmeInformation.findAll({
      where: {
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
      },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      distinct: true,
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Recently added MSME information retrieved successfully.",
      data: recentlyAddedMsmes,
      count: recentlyAddedMsmes.length,
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Recently Added MSME Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.allRegionBusiness = async (req, res) => {

  let { region } = req.params;

    if (!region) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Region is required.",
      });
    }
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
    
    const normalizedRegion = region.trim();

    const isRegion = await Region.findOne({
      where: { regionName: normalizedRegion },
      transaction,
      lock: transaction.LOCK.SHARE,
    });

    if (!isRegion) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The provided region does not exist.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        region: normalizedRegion,
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
      },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "MSME information for region retrieved successfully.",
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
      data: rows,
    });

  } catch (error) {
    await transaction.rollback();

    console.error("All Region Business Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.allTownBusiness = async (req, res) => {
  let { townName } = req.body;
  if (!townName) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Town name is required.",
      });
    }

  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
    const normalizedTown = townName.trim();

    const isTown = await Town.findOne({
      where: { townName: normalizedTown },
      transaction,
      lock: transaction.LOCK.SHARE,
    });

    if (!isTown) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The provided town does not exist.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        town: normalizedTown,
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
      },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "MSME information for town retrieved successfully.",
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
      data: rows,
    });

  } catch (error) {
    await transaction.rollback();

    console.error("All Town Business Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.allLiked = async (req, res) => {
  const userId = req.user.id;
    if (!userId) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {

    const existingUser = await User.findOne({
      where: { id: userId },
      transaction,
    });

    if (!existingUser) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist.",
      });
    }

    const likedBusinesses = await Favourite.findAll({
      where: { userId },
      attributes: ["businessId"],
      transaction,
    });

    const businessIds = likedBusinesses.map((like) => like.businessId);

    if (businessIds.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The user has not liked any businesses.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        id: { [Op.in]: businessIds },
        status: "Approved",
        isBlocked: false,
        isVisibility: true,
      },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      transaction,
    });

    if (rows.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "No approved MSMEs found for the liked business IDs.",
      });
    }

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Liked MSME information retrieved successfully.",
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
      data: rows,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("All Liked MSME Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.isBusinessLiked = async (req, res) => {
  const userId = req.user.id;
    const { businessId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
    if (!userId || !businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }

  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {

    const isLikedRecord = await Favourite.findOne({
      where: { userId, businessId },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business like status retrieved successfully.",
      data: { isLiked: !!isLikedRecord },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Business Like Status Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.isVisible = async (req, res) => {
  const userId = req.user.id;
    const { businessId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
    if (!userId || !businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
   
    const business = await MsmeInformation.findOne({
      where: { userId, id: businessId },
      transaction,
    });

    if (!business) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found.",
      });
    }

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business visibility status retrieved successfully.",
      data: { isVisible: !!business.isVisibility },
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error retrieving business visibility:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.allSingleUserMsme = async (req, res) => {
   const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter: userId is required.",
      });
    }
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await MsmeInformation.findAndCountAll({
      where: {
        userId,
        status: { [Op.not]: "Pending" },
      },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      transaction,
    });

    if (rows.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "No MSME information found for this user.",
      });
    }

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "MSME information retrieved successfully.",
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
      data: rows,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("All Single User MSME Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.single = async (req, res) => {
  const { businessId } = req.params;
    if (!businessId) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
    
    const msmeInformation = await MsmeInformation.findOne({
      where: {
        id: businessId,
        status: "Approved",
        isBlocked: false,
      },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
      transaction,
    });

    if (!msmeInformation) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "MSME information not found",
      });
    }

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "MSME information retrieved successfully.",
      data: msmeInformation,
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Single MSME Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.singleRejected = async (req, res) => {
  const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {

    const msmeInformation = await MsmeInformation.findOne({
      where: {
        id: businessId,
        [Op.or]: [
          { status: "Rejected" },
          { status: "Incomplete" },
        ],
      },
      include: [
        { model: MsmeFounderInfo, as: "founderInfo" },
        { model: MsmeContactInfo, as: "contactInfo" },
        { model: MsmeAdditionalInfo, as: "additionalInfo" },
        { model: BusinessHour, as: "businessHours" },
      ],
      transaction,
    });

    if (!msmeInformation) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "MSME information not found for Rejected/Incomplete status.",
      });
    }

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "MSME information retrieved successfully.",
      data: msmeInformation,
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Single Rejected MSME Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.update = async (req, res) => {
  const { businessId } = req.params;
    if (!businessId) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {
    
    const business = await MsmeInformation.findOne({ where: { id: businessId }, transaction });
    if (!business) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found.",
      });
    }

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
      numberOfEmployees,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      removeImage,
      removeImage1,
      removeImage2,
      removeImage3,
    } = req.body;

    if (businessRegistrationName && businessRegistrationName !== business.businessRegistrationName) {
      const existsName = await MsmeInformation.findOne({ where: { businessRegistrationName }, transaction });
      if (existsName) {
        await transaction.rollback();
        return res.status(409).json({
          status: "FAILURE",
          message: "Business registration name already in use.",
        });
      }
    }

    if (businessRegistrationNumber && businessRegistrationNumber !== business.businessRegistrationNumber) {
      const existsNumber = await MsmeInformation.findOne({ where: { businessRegistrationNumber }, transaction });
      if (existsNumber) {
        await transaction.rollback();
        return res.status(409).json({
          status: "FAILURE",
          message: "Business registration number already in use.",
        });
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

    const existingAdditional = await MsmeAdditionalInfo.findOne({ where: { businessId }, transaction });

    let businessLogo = existingAdditional?.businessLogo || null;

    if (removeImage) {
      if (businessLogo) {
        const oldPath = path.join("public", "msmes", businessLogo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const industry = await PrimaryIndustry.findOne({ where: { industryName: primaryIndustry }, transaction });
      if (industry?.industryIcon) {
        const sourcePath = path.join("public", "primary-industries", industry.industryIcon);
        const destPath = path.join("public", "msmes", industry.industryIcon);
        fs.copyFileSync(sourcePath, destPath);
        businessLogo = industry.industryIcon;
      }
    }

    if (req.files?.businessLogo?.[0]?.filename) {
      if (businessLogo) {
        const oldPath = path.join("public", "msmes", businessLogo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      businessLogo = req.files.businessLogo[0].filename;
    }

    await MsmeAdditionalInfo.update(
      { businessLogo, numberOfEmployees },
      { where: { businessId }, transaction }
    );

    const handleImage = async (field, removeFlag) => {
      if (removeFlag && existingAdditional?.[field]) {
        const oldPath = path.join("public", "msmes", existingAdditional[field]);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        await MsmeAdditionalInfo.update({ [field]: null }, { where: { businessId }, transaction });
      }
      if (req.files?.[field]?.[0]?.filename) {
        if (existingAdditional?.[field]) {
          const oldPath = path.join("public", "msmes", existingAdditional[field]);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        const newFile = req.files[field][0].filename;
        await MsmeAdditionalInfo.update({ [field]: newFile }, { where: { businessId }, transaction });
      }
    };

    await handleImage("image1", removeImage1);
    await handleImage("image2", removeImage2);
    await handleImage("image3", removeImage3);

    await BusinessHour.update(
      { monday, tuesday, wednesday, thursday, friday, saturday, sunday },
      { where: { businessId }, transaction }
    );

    if (["Rejected", "Incomplete"].includes(existingAdditional?.status)) {
      await MsmeInformation.update(
        { status: "Pending" },
        { where: { id: businessId }, transaction }
      );
    }

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business successfully updated!",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Business Update Error:", error);
    return res.status(500).json({
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
  const userId = req.user.id;
    const { businessId } = req.params;

    if (!userId) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
    if (!businessId) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {
    

    const user = await User.findOne({ where: { id: userId }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist in the system.",
      });
    }

    const additionalInfo = await MsmeAdditionalInfo.findOne({
      where: { businessId },
      transaction,
    });
    if (!additionalInfo) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The business resource does not exist.",
      });
    }

    if (!req.file || !req.file.filename) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "No business logo was uploaded.",
      });
    }

    const newLogo = req.file.filename;

    if (additionalInfo.businessLogo) {
      const oldLogoPath = path.join("public", "msmes", additionalInfo.businessLogo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    await MsmeAdditionalInfo.update(
      { businessLogo: newLogo },
      { where: { businessId }, transaction }
    );

    if (["Rejected", "Incomplete"].includes(additionalInfo.status)) {
      await MsmeInformation.update(
        { status: "Pending" },
        { where: { id: businessId }, transaction }
      );
    }

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business logo successfully updated.",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating business logo:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

const updateBusinessImage = async (req, res, imageField) => {
  const userId = req.user.id;
    const { businessId } = req.params;
  if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
    if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {

    const user = await User.findOne({ where: { id: userId }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User does not exist in the system.",
      });
    }

    const additionalInfo = await MsmeAdditionalInfo.findOne({
      where: { businessId },
      transaction,
    });
    if (!additionalInfo) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The business resource does not exist.",
      });
    }

    if (!req.file || !req.file.filename) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: `No ${imageField} was uploaded.`,
      });
    }

    const newImage = req.file.filename;

    if (additionalInfo[imageField]) {
      const oldImagePath = path.join("public", "msmes", additionalInfo[imageField]);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    await MsmeAdditionalInfo.update(
      { [imageField]: newImage },
      { where: { businessId }, transaction }
    );

    if (["Rejected", "Incomplete"].includes(additionalInfo.status)) {
      await MsmeInformation.update(
        { status: "Pending" },
        { where: { id: businessId }, transaction }
      );
    }

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: `${imageField} successfully updated.`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error updating ${imageField}:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.updateImage1 = (req, res) => updateBusinessImage(req, res, "image1");
exports.updateImage2 = (req, res) => updateBusinessImage(req, res, "image2");
exports.updateImage3 = (req, res) => updateBusinessImage(req, res, "image3");

exports.businessHours = async (req, res) => {
   const userId = req.user.id;
    const { businessId } = req.params;
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = req.body;
   if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
    if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
  const transaction = await sequelize.transaction();
  try {

    const user = await User.findOne({ where: { id: userId }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User trying to access this resource does not exist on the system.",
      });
    }

    const additionalInfo = await MsmeAdditionalInfo.findOne({ where: { businessId }, transaction });
    if (!additionalInfo) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The business resource does not exist on the system.",
      });
    }

    await BusinessHour.update(
      { monday, tuesday, wednesday, thursday, friday, saturday, sunday },
      { where: { businessId }, transaction }
    );

    if (["Rejected", "Incomplete"].includes(additionalInfo.status)) {
      await MsmeInformation.update(
        { status: "Pending" },
        { where: { id: businessId }, transaction }
      );
    }

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business hours updated successfully.",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating business hours:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.delete = async (req, res) => {
  const userId = req.user.id;
    const { businessId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }
    if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }
  const t = await sequelize.transaction();
  try {
    

    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        status: "FAILURE",
        message: "User trying to access this resource does not exist on the system.",
      });
    }

    const business = await MsmeInformation.findOne({ where: { id: businessId } });
    if (!business) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The business does not exist on the system.",
      });
    }

    const { businessLogo, image1, image2, image3 } = business;
    [businessLogo, image1, image2, image3].forEach((file) => {
      if (file) {
        const fullPath = path.join("public", "msmes", file);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    });

    await MsmeFounderInfo.destroy({ where: { businessId }, transaction: t });
    await MsmeContactInfo.destroy({ where: { businessId }, transaction: t });
    await MsmeAdditionalInfo.destroy({ where: { businessId }, transaction: t });
    await BusinessHour.destroy({ where: { businessId }, transaction: t });
    await MsmeInformation.destroy({ where: { id: businessId }, transaction: t });

    await t.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business and all associated records and images successfully deleted.",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error deleting business:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.visibility = async (req, res) => {
   const userId = req.user.id;
    const { businessId, visibility } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }

    if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Business ID is required.",
      });
    }

    if (typeof visibility !== "boolean") {
      return res.status(400).json({
        status: "FAILURE",
        message: "Visibility must be a boolean value.",
      });
    }
  const transaction = await sequelize.transaction();
  try {
   
    const existingUser = await User.findOne({ where: { id: userId }, transaction });
    if (!existingUser) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User trying to access this resource does not exist on the system.",
      });
    }

    const business = await MsmeInformation.findOne({ where: { id: businessId }, transaction });
    if (!business) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Business does not exist on the system.",
      });
    }

    await MsmeInformation.update(
      { isVisibility: visibility },
      { where: { id: businessId }, transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: `Business visibility successfully updated to ${visibility}.`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating business visibility:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};