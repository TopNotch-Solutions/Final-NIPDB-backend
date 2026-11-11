const sequelize = require("../../config/dbConfig");
const Policy = require("../../models/policies");
const sendErrorAlert = require("../../utils/shared/sendErrorAlert");

exports.create = async (req, res) => {
  let { policy } = req.body;

  if (!policy) {
    return res.status(400).json({
      status: "FAILURE",
      message: "policy is required.",
    });
  }
  const transaction = await sequelize.transaction();
  try {
    await Policy.create({ policy }, { transaction });
    await transaction.commit();

    return res.status(201).json({
      status: "SUCCESS",
      message: "Policy successfully created!",
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/policyController.js" });
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.update = async (req, res) => {
  const { policy } = req.body;
  const policyId = req.params.id || req.body.policyId;

  if (!policy) {
    return res.status(400).json({
      status: "FAILURE",
      message: "policy is required.",
    });
  }

  if (!policyId) {
    return res.status(400).json({
      status: "FAILURE",
      message: "policy ID is required.",
    });
  }

  const transaction = await sequelize.transaction();
  try {
    const existingPolicy = await Policy.findOne({
      where: { id: policyId },
      transaction,
    });
    if (!existingPolicy) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Policy not found!",
      });
    }

    await Policy.update({ policy }, { where: { id: policyId }, transaction });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Policy successfully updated!",
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/policyController.js" });
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};
