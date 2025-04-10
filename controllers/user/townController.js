const Town = require("../../models/town");

exports.all = async (req, res) => {
  try {
    
    const town = await Town.findAll();
    if (town) {
      res.status(201).json({
        status: "SUCCESS",
        message: "Towns successfully retrieved!",
        data: town,
      });
    } else {
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error.",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.single = async (req, res) => {
  try {
    const id = req.params.id;

    if (id === "") {
      res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    } else {
      const town = await Town.findOne({
        where: {
          id,
        },
      });

      if (town) {
        res.status(200).json({
          status: "SUCCESS",
          message: "town successfully retrieved!",
          data: town,
        });
      } else {
        res.status(404).json({
          status: "FAILURE",
          message: "The region provided does not exist.",
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};


exports.getTownsByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;

    if (!regionId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Region ID is required.",
      });
    }

    const towns = await Town.findAll({
      where: {
        regionId: regionId,
      },
    });

    if (towns.length > 0) {
      res.status(200).json({
        status: "SUCCESS",
        message: "Towns successfully retrieved by region!",
        data: towns,
      });
    } else {
      res.status(404).json({
        status: "FAILURE",
        message: "No towns found for the provided region.",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
