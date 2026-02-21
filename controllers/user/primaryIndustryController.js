const PrimaryIndustry = require('../../models/primaryIndustry');
exports.all = async (req, res) => {
  try {
    const primaryIndustries = await PrimaryIndustry.findAll();

    if (!primaryIndustries || primaryIndustries.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message: "No industries found.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Industries successfully retrieved!",
      data: primaryIndustries,
    });
  } catch (error) {
    console.error("Fetch All Industries Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.allIndustryName = async (req, res) => {
  try {
    const primaryIndustries = await PrimaryIndustry.findAll({
      attributes: ['id', 'industryName'],
    });

    if (!primaryIndustries || primaryIndustries.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message: "No industries found.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Industries successfully retrieved!",
      data: primaryIndustries,
    });
  } catch (error) {
    console.error("Fetch Industry Names Error:", error);
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
        message: "Industry ID is required.",
      });
    }

  try {
   
    const primaryIndustry = await PrimaryIndustry.findOne({ where: { id } });

    if (!primaryIndustry) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry not found.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully retrieved!",
      data: primaryIndustry,
    });
  } catch (error) {
    console.error("Fetch Single Industry Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.allWithoutIcon = async (req, res) => {
  try {
    const primaryIndustries = await PrimaryIndustry.findAll({
      attributes: ['id', 'industryName', 'label'], 
    });

    if (!primaryIndustries || primaryIndustries.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message: "No industries found.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Industries successfully retrieved without icons!",
      data: primaryIndustries,
    });
  } catch (error) {
    console.error("Fetch Industries Without Icon Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};