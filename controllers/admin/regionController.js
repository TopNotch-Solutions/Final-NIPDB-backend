const sequelize = require("../../config/dbConfig");
const Region = require("../../models/region");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");

exports.create = async (req, res) => {
  let { regionName } = req.body;

    if (!regionName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Region name is required.",
      });
    }
  const transaction = await sequelize.transaction();
  try {
  
    regionName = CapitalizeFirstLetter(regionName.trim());

    const existingRegion = await Region.findOne({ 
      where: { regionName }, 
      transaction 
    });
    if (existingRegion) {
      await transaction.rollback();
      return res.status(409).json({
        status: "FAILURE",
        message: "Region already exists!",
      });
    }

    const newRegion = await Region.create({ regionName }, { transaction });
    await transaction.commit();

    return res.status(201).json({
      status: "SUCCESS",
      message: "Region successfully created!",
      data: newRegion
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.all = async (req, res) => {
  try {
    const regions = await Region.findAll();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Regions successfully retrieved!",
      data: regions
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.single = async (req, res) => {
  const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "ID is required.",
      });
    }

  try {
    
    const region = await Region.findByPk(id);
    if (!region) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The region provided does not exist.",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Region successfully retrieved!",
      data: region
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};