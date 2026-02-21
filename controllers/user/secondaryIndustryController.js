const SecondaryIndustry = require('../../models/secondaryIndustry')

exports.all = async (req, res) => {
  try {
    const secondaryIndustries = await SecondaryIndustry.findAll();

    if (!secondaryIndustries || secondaryIndustries.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message: "No secondary industries found.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Secondary industries successfully retrieved!",
      data: secondaryIndustries,
    });
  } catch (error) {
    console.error("Fetch All Secondary Industries Error:", error);
    res.status(500).json({
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
        message: "Secondary industry ID is required.",
      });
    }
  try {

    const secondaryIndustry = await SecondaryIndustry.findOne({ where: { id } });

    if (!secondaryIndustry) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The secondary industry provided does not exist.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Secondary industry successfully retrieved!",
      data: secondaryIndustry,
    });
  } catch (error) {
    console.error("Fetch Single Secondary Industry Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};