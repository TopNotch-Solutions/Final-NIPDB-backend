const SecondaryIndustry = require('../../models/secondaryIndustry');
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');
const { getCache, setCache } = require('../../utils/shared/cacheService');

exports.all = async (req, res) => {
  try {
    const cachedIndustries = await getCache("secondary_industry:all");
    if (cachedIndustries) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Secondary industries successfully retrieved!",
        data: cachedIndustries,
      });
    }

    const secondaryIndustries = await SecondaryIndustry.findAll();

    if (!secondaryIndustries || secondaryIndustries.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No secondary industries found.",
        data: []
      });
    }

    await setCache("secondary_industry:all", secondaryIndustries);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Secondary industries successfully retrieved!",
      data: secondaryIndustries,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/secondaryIndustryController.js" });
    console.error("Fetch All Secondary Industries Error:", error);
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
      message: "Secondary industry ID is required.",
    });
  }
  try {
    const cachedIndustry = await getCache(`secondary_industry:${id}`);
    if (cachedIndustry) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Secondary industry successfully retrieved!",
        data: cachedIndustry,
      });
    }

    const secondaryIndustry = await SecondaryIndustry.findOne({ where: { id } });

    if (!secondaryIndustry) {
      return res.status(200).json({
        status: "FAILURE",
        message: "The secondary industry provided does not exist.",
        data: []
      });
    }

    await setCache(`secondary_industry:${secondaryIndustry.id}`, secondaryIndustry);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Secondary industry successfully retrieved!",
      data: secondaryIndustry,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/secondaryIndustryController.js" });
    console.error("Fetch Single Secondary Industry Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};
