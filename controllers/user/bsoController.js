const BSO = require("../../models/bso");
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');
const { getCache, setCache } = require('../../utils/shared/cacheService');

exports.all = async (req, res) => {
  try {
    const cachedBsos = await getCache("bso:all");
    if (cachedBsos) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "BSO records retrieved successfully.",
        data: cachedBsos,
      });
    }

    const bsos = await BSO.findAll();
    if (bsos) {
      await setCache("bso:all", bsos);
      return res.status(200).json({
        status: "SUCCESS",
        message: "BSO records retrieved successfully.",
        data: bsos,
      });
    } else {
      return res.status(500).json({
        status: "FAILURE",
        message: "Internal server error.",
      });
    }
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/bsoController.js" });
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};

exports.single = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "BSO ID is required.",
      });
    }

    const cachedBso = await getCache(`bso:${id}`);
    if (cachedBso) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "BSO record retrieved successfully.",
        data: cachedBso,
      });
    }

    const bso = await BSO.findOne({ where: { id } });

    if (!bso) {
      return res.status(200).json({
        status: "FAILURE",
        message: `No BSO found with ID: ${id}`,
        data: []
      });
    }

    await setCache(`bso:${bso.id}`, bso);

    return res.status(200).json({
      status: "SUCCESS",
      message: "BSO record retrieved successfully.",
      data: bso,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/bsoController.js" });
    console.error(`Error fetching BSO with ID ${req.params.id}:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};
