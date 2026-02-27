const sequelize = require("../../config/dbConfig");
const Town = require("../../models/town");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");

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

    return res.status(201).json({
      status: "SUCCESS",
      message: "Town successfully created!",
      data: newTown
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
    const towns = await Town.findAll();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Towns successfully retrieved!",
      data: towns
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
    
    const town = await Town.findByPk(id);
    if (!town) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The town provided does not exist.",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Town successfully retrieved!",
      data: town
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};