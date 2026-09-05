const Region = require('../../models/region');
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');
const { getCache, setCache } = require('../../utils/shared/cacheService');

exports.all = async (req, res) => {
  try {
    const cachedRegions = await getCache("region:all");
    if (cachedRegions) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Regions successfully retrieved!",
        data: cachedRegions,
      });
    }

    const regions = await Region.findAll();

    if (!regions || regions.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No regions found.",
        data: []
      });
    }

    await setCache("region:all", regions);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Regions successfully retrieved!",
      data: regions,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/regionController.js" });
    console.error("Fetch All Regions Error:", error);
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
      message: "Region ID is required.",
    });
  }

  try {
    const cachedRegion = await getCache(`region:${id}`);
    if (cachedRegion) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Region successfully retrieved!",
        data: cachedRegion,
      });
    }

    const region = await Region.findOne({ where: { id } });

    if (!region) {
      return res.status(200).json({
        status: "FAILURE",
        message: "The region provided does not exist.",
        data: []
      });
    }

    await setCache(`region:${region.id}`, region);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Region successfully retrieved!",
      data: region,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/regionController.js" });
    console.error("Fetch Single Region Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};
