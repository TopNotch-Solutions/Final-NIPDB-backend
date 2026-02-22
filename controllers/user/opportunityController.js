const Opportunity = require('../../models/opportunity');

exports.allGeneral = async (req, res) => {
  try {
    const allOpportunities = await Opportunity.findAll({
      where: { user: "General User" },
    });

    if (!allOpportunities || allOpportunities.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No opportunities found for General User.",
        data:[]
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Opportunities successfully retrieved for General User!",
      data: allOpportunities,
    });
  } catch (error) {
    console.error("All General Opportunities Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
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

    res.status(200).json({
      status: "SUCCESS",
      message: "Opportunity successfully retrieved!",
      data: opportunity,
    });
  } catch (error) {
    console.error("Single General Opportunity Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.allBusiness = async (req, res) => {
  try {
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

    res.status(200).json({
      status: "SUCCESS",
      message: "Opportunities successfully retrieved for Business User!",
      data: allOpportunities,
    });
  } catch (error) {
    console.error("All Business Opportunities Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
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

    res.status(200).json({
      status: "SUCCESS",
      message: "Opportunity successfully retrieved!",
      data: opportunity,
    });
  } catch (error) {
    console.error("Single Business Opportunity Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};