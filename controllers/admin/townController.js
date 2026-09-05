const sequelize = require("../../config/dbConfig");
const Town = require("../../models/town");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');
const { getCache, setCache, delCache, delPattern } = require("../../utils/shared/cacheService");

exports.create = async (req, res) => {
  let { townName, regionId } = req.body;

  if (!townName) {
    return res.status(400).json({
      status: "FAILURE",
      message: "Town name is required.",
    });
  }

  if (!regionId) {
    return res.status(400).json({
      status: "FAILURE",
      message: "region ID is required.",
    });
  }
  const transaction = await sequelize.transaction();
  try {
    townName = CapitalizeFirstLetter(townName.trim());

    const existingTown = await Town.findOne({ 
      where: { townName }, 
      transaction 
    });
    if (existingTown) {
      await transaction.rollback();
      return res.status(409).json({
        status: "FAILURE",
        message: "Town already exists!",
      });
    }

    const newTown = await Town.create({ townName, regionId }, { transaction });
    await transaction.commit();

    await setCache(`town:${newTown.id}`, newTown);
    await delCache("town:all", `town:region:${regionId}`);
    await delPattern("town:region:*");

    return res.status(201).json({
      status: "SUCCESS",
      message: "Town successfully created!",
      data: newTown
    });

  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/townController.js" });
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
    const cachedTowns = await getCache("town:all");
    if (cachedTowns) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Towns successfully retrieved!",
        data: cachedTowns
      });
    }

    const towns = await Town.findAll();
    if (towns && towns.length > 0) {
      await setCache("town:all", towns);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Towns successfully retrieved!",
      data: towns
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/townController.js" });
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
    const cachedTown = await getCache(`town:${id}`);
    if (cachedTown) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Town successfully retrieved!",
        data: cachedTown
      });
    }

    const town = await Town.findByPk(id);
    if (!town) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The town provided does not exist.",
      });
    }

    await setCache(`town:${town.id}`, town);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Town successfully retrieved!",
      data: town
    });

  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/townController.js" });
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  let { townName, regionId } = req.body;

  if (!id) {
    return res.status(400).json({
      status: "FAILURE",
      message: "ID is required.",
    });
  }
  if (!townName) {
    return res.status(400).json({
      status: "FAILURE",
      message: "Town name is required.",
    });
  }

  const transaction = await sequelize.transaction();
  try {
    townName = CapitalizeFirstLetter(townName.trim());

    const town = await Town.findByPk(id, { transaction });
    if (!town) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The town provided does not exist.",
      });
    }

    if (townName !== town.townName) {
      const duplicateCheck = await Town.findOne({
        where: { townName },
        transaction,
      });
      if (duplicateCheck) {
        await transaction.rollback();
        return res.status(409).json({
          status: "FAILURE",
          message: "Town already exists!",
        });
      }
    }

    const oldRegionId = town.regionId;
    town.townName = townName;
    if (regionId) town.regionId = regionId;
    await town.save({ transaction });
    await transaction.commit();

    await delCache(`town:${id}`, "town:all", `town:region:${oldRegionId}`, `town:region:${town.regionId}`);
    await delPattern("town:region:*");

    return res.status(200).json({
      status: "SUCCESS",
      message: "Town successfully updated!",
      data: town
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/townController.js" });
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
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
    const town = await Town.findByPk(id, { transaction });
    if (!town) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "The town provided does not exist.",
      });
    }

    const regionId = town.regionId;
    await town.destroy({ transaction });
    await transaction.commit();

    await delCache(`town:${id}`, "town:all", `town:region:${regionId}`);
    await delPattern("town:region:*");

    return res.status(200).json({
      status: "SUCCESS",
      message: "Town successfully deleted!",
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/townController.js" });
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};
