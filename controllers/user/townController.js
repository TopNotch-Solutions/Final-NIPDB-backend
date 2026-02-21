const Town = require("../../models/town");

exports.all = async (req, res) => {
  try {
    const towns = await Town.findAll();

    if (!towns || towns.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message: "No towns found.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Towns successfully retrieved!",
      data: towns,
    });
  } catch (error) {
    console.error("Fetch All Towns Error:", error);
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
        message: "Town ID is required.",
      });
    }

  try {
   
    const town = await Town.findOne({ where: { id } });

    if (!town) {
      return res.status(404).json({
        status: "FAILURE",
        message: "The town provided does not exist.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Town successfully retrieved!",
      data: town,
    });
  } catch (error) {
    console.error("Fetch Single Town Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.getTownsByRegion = async (req, res) => {
  const { regionId } = req.params;

    if (!regionId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Region ID is required.",
      });
    }
  try {

    const towns = await Town.findAll({ where: { regionId } });

    if (!towns || towns.length === 0) {
      return res.status(404).json({
        status: "FAILURE",
        message: "No towns found for the provided region.",
        data: []
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Towns successfully retrieved by region!",
      data: towns,
    });
  } catch (error) {
    console.error("Fetch Towns by Region Error:", error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};