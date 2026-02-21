const BSO = require("../../models/bso");

exports.all = async (req, res) => {
    try {
      const bsos = await BSO.findAll();
      if (bsos) {
        res.status(201).json({
          status: "SUCCESS",
          message: "BSO records retrieved successfully.",
          data: bsos,
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
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "BSO ID is required.",
      });
    }

    const bso = await BSO.findOne({ where: { id } });

    if (!bso) {
      return res.status(404).json({
        status: "FAILURE",
        message: `No BSO found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "BSO record retrieved successfully.",
      data: bso,
    });
  } catch (error) {
    console.error(`Error fetching BSO with ID ${req.params.id}:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};