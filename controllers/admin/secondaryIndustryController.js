const { where } = require("sequelize");
const SecondaryIndustry = require("../../models/secondaryIndustry");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const sequelize = require("../../config/dbConfig");
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');
const { getCache, setCache, delCache } = require("../../utils/shared/cacheService");

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
      await t.rollback();
      return res.status(409).json({
        status: "FAILURE",
        message: "Industry already exists!",
      });
    }

    const newIndustry = await SecondaryIndustry.create({ industryName }, { transaction: t });
    await t.commit();

    await setCache(`secondary_industry:${newIndustry.id}`, newIndustry);
    await delCache("secondary_industry:all");

    return res.status(201).json({
      status: "SUCCESS",
      message: "Industry successfully created!",
      data: newIndustry,
    });

  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/secondaryIndustryController.js" });
    await t.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};

exports.all = async (req, res) => {
  try {
    const cachedIndustries = await getCache("secondary_industry:all");
    if (cachedIndustries) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Industries successfully retrieved!",
        data: cachedIndustries,
      });
    }

    const industries = await SecondaryIndustry.findAll();
    if (industries && industries.length > 0) {
      await setCache("secondary_industry:all", industries);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industries successfully retrieved!",
      data: industries || [],
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/secondaryIndustryController.js" });
    return res.status(500).json({
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
      message: "ID is required.",
    });
  }
  try {
    const cachedIndustry = await getCache(`secondary_industry:${id}`);
    if (cachedIndustry) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Industry successfully retrieved!",
        data: cachedIndustry,
      });
    }

    const industry = await SecondaryIndustry.findOne({ where: { id } });
    if (!industry) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided id does not exist.",
      });
    }

    await setCache(`secondary_industry:${industry.id}`, industry);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully retrieved!",
      data: industry,
    });

  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/secondaryIndustryController.js" });
    return res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
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
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided id does not exist.",
      });
    }

    if (industryName !== existingIndustry.industryName) {
      const duplicateCheck = await SecondaryIndustry.findOne({ where: { industryName } });
      if (duplicateCheck) {
        await t.rollback();
        return res.status(409).json({
          status: "FAILURE",
          message: "Industry name already exists.",
        });
      }
    }

    await SecondaryIndustry.update({ industryName }, { where: { id }, transaction: t });
    await t.commit();

    await delCache(`secondary_industry:${id}`, "secondary_industry:all");

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully updated!",
    });

  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/secondaryIndustryController.js" });
    await t.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
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
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided id does not exist.",
      });
    }

    await SecondaryIndustry.destroy({ where: { id }, transaction: t });
    await t.commit();

    await delCache(`secondary_industry:${id}`, "secondary_industry:all");

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully deleted!",
    });

  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/secondaryIndustryController.js" });
    await t.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};
