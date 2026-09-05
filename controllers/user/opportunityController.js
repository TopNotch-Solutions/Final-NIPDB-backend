const Opportunity = require('../../models/opportunity');
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');
const { getCache, setCache } = require('../../utils/shared/cacheService');

exports.allGeneral = async (req, res) => {
  try {
    const cachedOpportunities = await getCache("opportunity:all:general");
    if (cachedOpportunities) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Opportunities successfully retrieved for General User!",
        data: cachedOpportunities,
      });
    }

    const allOpportunities = await Opportunity.findAll({
      where: { user: "General User" },
    });

    if (!allOpportunities || allOpportunities.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No opportunities found for General User.",
        data: []
      });
    }

    await setCache("opportunity:all:general", allOpportunities);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunities successfully retrieved for General User!",
      data: allOpportunities,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/opportunityController.js" });
    console.error("All General Opportunities Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};

exports.singleGeneral = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "FAILURE",
      message: "Opportunity ID is required.",
    });
  }
  try {
    const cachedOpportunity = await getCache(`opportunity:${id}`);
    if (cachedOpportunity && cachedOpportunity.user === "General User") {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Opportunity successfully retrieved!",
        data: cachedOpportunity,
      });
    }

    const opportunity = await Opportunity.findOne({
      where: { id, user: "General User" },
    });

    if (!opportunity) {
      return res.status(200).json({
        status: "FAILURE",
        message: "Opportunity not found for General User.",
        data: []
      });
    }

    await setCache(`opportunity:${opportunity.id}`, opportunity);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunity successfully retrieved!",
      data: opportunity,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/opportunityController.js" });
    console.error("Single General Opportunity Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};

exports.allBusiness = async (req, res) => {
  try {
    const cachedOpportunities = await getCache("opportunity:all:business");
    if (cachedOpportunities) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Opportunities successfully retrieved for Business User!",
        data: cachedOpportunities,
      });
    }

    const allOpportunities = await Opportunity.findAll({
      where: { user: "Business User" },
    });

    if (!allOpportunities || allOpportunities.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No opportunities found for Business User.",
        data: []
      });
    }

    await setCache("opportunity:all:business", allOpportunities);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunities successfully retrieved for Business User!",
      data: allOpportunities,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/opportunityController.js" });
    console.error("All Business Opportunities Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};

exports.singleBusiness = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "FAILURE",
      message: "Opportunity ID is required.",
    });
  }
  try {
    const cachedOpportunity = await getCache(`opportunity:${id}`);
    if (cachedOpportunity && cachedOpportunity.user === "Business User") {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Opportunity successfully retrieved!",
        data: cachedOpportunity,
      });
    }

    const opportunity = await Opportunity.findOne({
      where: { id, user: "Business User" },
    });

    if (!opportunity) {
      return res.status(200).json({
        status: "FAILURE",
        message: "Opportunity not found for Business User.",
        data: []
      });
    }

    await setCache(`opportunity:${opportunity.id}`, opportunity);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunity successfully retrieved!",
      data: opportunity,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/opportunityController.js" });
    console.error("Single Business Opportunity Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Something went wrong on our end. Please try again in a few moments.",
    });
  }
};
