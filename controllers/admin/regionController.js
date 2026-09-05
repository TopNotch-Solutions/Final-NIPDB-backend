const sequelize = require("../../config/dbConfig");
const Region = require("../../models/region");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');
const { getCache, setCache, delCache } = require("../../utils/shared/cacheService");

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

    await setCache(`region:${newRegion.id}`, newRegion);
    await delCache("region:all");

    return res.status(201).json({
      status: "SUCCESS",
      message: "Region successfully created!",
      data: newRegion
    });

  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/regionController.js" });
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
    const cachedRegions = await getCache("region:all");
    if (cachedRegions) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Regions successfully retrieved!",
        data: cachedRegions
      });
    }

    const regions = await Region.findAll();
    if (regions && regions.length > 0) {
      await setCache("region:all", regions);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Regions successfully retrieved!",
      data: regions
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/regionController.js" });
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
    const cachedRegion = await getCache(`region:${id}`);
    if (cachedRegion) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Region successfully retrieved!",
        data: cachedRegion
      });
    }

    const region = await Region.findByPk(id);
    if (!region) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The region provided does not exist.",
      });
    }

    await setCache(`region:${region.id}`, region);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Region successfully retrieved!",
      data: region
    });

  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/regionController.js" });
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  let { regionName } = req.body;

  if (!id) {
    return res.status(400).json({
      status: "FAILURE",
      message: "ID is required.",
    });
  }
  if (!regionName) {
    return res.status(400).json({
      status: "FAILURE",
      message: "Region name is required.",
    });
  }

  const transaction = await sequelize.transaction();
  try {
    regionName = CapitalizeFirstLetter(regionName.trim());

    const region = await Region.findByPk(id, { transaction });
    if (!region) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The region provided does not exist.",
      });
    }

    if (regionName !== region.regionName) {
      const duplicateCheck = await Region.findOne({
        where: { regionName },
        transaction,
      });
      if (duplicateCheck) {
        await transaction.rollback();
        return res.status(409).json({
          status: "FAILURE",
          message: "Region already exists!",
        });
      }
    }

    region.regionName = regionName;
    await region.save({ transaction });
    await transaction.commit();

    await delCache(`region:${id}`, "region:all");

    return res.status(200).json({
      status: "SUCCESS",
      message: "Region successfully updated!",
      data: region,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/regionController.js" });
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "FAILURE",
      message: "ID is required.",
    });
  }

  const transaction = await sequelize.transaction();
  try {
    const region = await Region.findByPk(id, { transaction });
    if (!region) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The region provided does not exist.",
      });
    }

    await region.destroy({ transaction });
    await transaction.commit();

    await delCache(`region:${id}`, "region:all");

    return res.status(200).json({
      status: "SUCCESS",
      message: "Region successfully deleted!",
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/regionController.js" });
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};
