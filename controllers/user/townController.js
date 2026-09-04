const Town = require("../../models/town");
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');

exports.all = async (req, res) => {
  try {
    const towns = await Town.findAll();

    if (!towns || towns.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No towns found.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Towns successfully retrieved!",
      data: towns,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/townController.js" });
    console.error("Fetch All Towns Error:", error);
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
        message: "Town ID is required.",
      });
    }

  try {
   
    const town = await Town.findOne({ where: { id } });

    if (!town) {
      return res.status(200).json({
        status: "FAILURE",
        message: "The town provided does not exist.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Town successfully retrieved!",
      data: town,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/townController.js" });
    console.error("Fetch Single Town Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};

exports.getTownsByRegion = async (req, res) => {
  const { regionId } = req.params;

    if (!regionId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Region ID is required.",
      });
    }
  try {

    const towns = await Town.findAll({ where: { regionId } });

    if (!towns || towns.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No towns found for the provided region.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Towns successfully retrieved by region!",
      data: towns,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/townController.js" });
    console.error("Fetch Towns by Region Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};