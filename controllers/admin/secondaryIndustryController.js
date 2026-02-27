const { where } = require("sequelize");
const SecondaryIndustry = require("../../models/secondaryIndustry");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const sequelize = require("../../config/dbConfig");

exports.create = async (req, res) => {
  let { industryName } = req.body;

    if (!industryName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Industry name is required.",
      });
    }
  const t = await sequelize.transaction();
  try {
    

    industryName = CapitalizeFirstLetter(industryName);

    const existingIndustry = await SecondaryIndustry.findOne({ where: { industryName } });
    if (existingIndustry) {
      return res.status(409).json({
        status: "FAILURE",
        message: "Industry already exists!",
      });
    }

    const newIndustry = await SecondaryIndustry.create({ industryName }, { transaction: t });
    await t.commit();

    return res.status(201).json({
      status: "SUCCESS",
      message: "Industry successfully created!",
      data: newIndustry,
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.all = async (req, res) => {
  try {
    const industries = await SecondaryIndustry.findAll();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Industries successfully retrieved!",
      data: industries || [],
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
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

    const industry = await SecondaryIndustry.findOne({ where: { id } });
    if (!industry) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided id does not exist.",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully retrieved!",
      data: industry,
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
    let { industryName } = req.body;

    if (!industryName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Industry name is required.",
      });
    }
    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "ID is required.",
      });
    }

  const t = await sequelize.transaction();
  try {

    industryName = CapitalizeFirstLetter(industryName);

    const existingIndustry = await SecondaryIndustry.findOne({ where: { id } });
    if (!existingIndustry) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided id does not exist.",
      });
    }

    if (industryName !== existingIndustry.industryName) {
      const duplicateCheck = await SecondaryIndustry.findOne({ where: { industryName } });
      if (duplicateCheck) {
        return res.status(409).json({
          status: "FAILURE",
          message: "Industry name already exists.",
        });
      }
    }

    await SecondaryIndustry.update({ industryName }, { where: { id }, transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully updated!",
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
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
  const t = await sequelize.transaction();
  try {

    const industry = await SecondaryIndustry.findOne({ where: { id } });
    if (!industry) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided id does not exist.",
      });
    }

    await SecondaryIndustry.destroy({ where: { id }, transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully deleted!",
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};