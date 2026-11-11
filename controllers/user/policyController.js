const Policy = require("../../models/policies");
const sendErrorAlert = require("../../utils/shared/sendErrorAlert");

exports.policies = async (req, res) => {
  try {
    const allPolicies = await Policy.findAll();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Policy successfully retrieved!",
      data: allPolicies || [],
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/policyController.js" });
    return res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};