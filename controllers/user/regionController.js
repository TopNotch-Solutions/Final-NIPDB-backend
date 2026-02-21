const Region = require('../../models/region');

exports.all = async (req, res) => {
  try {
    const regions = await Region.findAll();

    if (!regions || regions.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message: "No regions found.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Regions successfully retrieved!",
      data: regions,
    });
  } catch (error) {
    console.error("Fetch All Regions Error:", error);
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
        message: "Region ID is required.",
      });
    }

  try {

    const region = await Region.findOne({ where: { id } });

    if (!region) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The region provided does not exist.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Region successfully retrieved!",
      data: region,
    });
  } catch (error) {
    console.error("Fetch Single Region Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};