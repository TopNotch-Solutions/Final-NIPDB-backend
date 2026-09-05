const PrimaryIndustry = require('../../models/primaryIndustry');
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');
const { getCache, setCache } = require('../../utils/shared/cacheService');

exports.all = async (req, res) => {
  try {
    const cachedIndustries = await getCache("primary_industry:all");
    if (cachedIndustries) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Industries successfully retrieved!",
        data: cachedIndustries,
      });
    }

    const primaryIndustries = await PrimaryIndustry.findAll();

    if (!primaryIndustries || primaryIndustries.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No industries found.",
        data: []
      });
    }

    await setCache("primary_industry:all", primaryIndustries);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industries successfully retrieved!",
      data: primaryIndustries,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/primaryIndustryController.js" });
    console.error("Fetch All Industries Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};

exports.allIndustryName = async (req, res) => {
  try {
    const cachedNames = await getCache("primary_industry:all_names");
    if (cachedNames) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Industries successfully retrieved!",
        data: cachedNames,
      });
    }

    const primaryIndustries = await PrimaryIndustry.findAll({
      attributes: ['id', 'industryName'],
    });

    if (!primaryIndustries || primaryIndustries.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No industries found.",
        data: []
      });
    }

    await setCache("primary_industry:all_names", primaryIndustries);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industries successfully retrieved!",
      data: primaryIndustries,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/primaryIndustryController.js" });
    console.error("Fetch Industry Names Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};

exports.single = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "FAILURE",
      message: "Industry ID is required.",
    });
  }

  try {
    const cachedIndustry = await getCache(`primary_industry:${id}`);
    if (cachedIndustry) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Industry successfully retrieved!",
        data: cachedIndustry,
      });
    }

    const primaryIndustry = await PrimaryIndustry.findOne({ where: { id } });

    if (!primaryIndustry) {
      return res.status(200).json({
        status: "FAILURE",
        message: "Industry not found.",
        data: []
      });
    }

    await setCache(`primary_industry:${primaryIndustry.id}`, primaryIndustry);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully retrieved!",
      data: primaryIndustry,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/primaryIndustryController.js" });
    console.error("Fetch Single Industry Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};

exports.allWithoutIcon = async (req, res) => {
  try {
    const cachedData = await getCache("primary_industry:all_without_icon");
    if (cachedData) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Industries successfully retrieved without icons!",
        data: cachedData,
      });
    }

    const primaryIndustries = await PrimaryIndustry.findAll({
      attributes: ['id', 'industryName', 'label'], 
    });

    if (!primaryIndustries || primaryIndustries.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No industries found.",
        data: []
      });
    }

    await setCache("primary_industry:all_without_icon", primaryIndustries);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industries successfully retrieved without icons!",
      data: primaryIndustries,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/primaryIndustryController.js" });
    console.error("Fetch Industries Without Icon Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};
