const Region = require("../../models/region");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");

exports.create = async (req, res) => {
  try {
    let { regionName } = req.body;
    
    if (regionName === "") {
        res.status(400).json({
          status: "FAILURE",
          message: "Empty input fields",
        });
    } else {
      regionName = CapitalizeFirstLetter(regionName);
      const region = await Region.findOne({
        where: {
          regionName,
        },
      });
      if (region) {
        res.status(409).json({
          status: "FAILURE",
          message: "Region already exist!",
        });
      } else {
        const newRegion = await Region.create({
          regionName
        });
        if (newRegion) {
          res.status(201).json({
            status: "SUCCESS",
            message: "Region successfully created!",
          });
        } else {
          res.status(500).json({
            status: "FAILURE",
            message: "Internal server error.",
          });
        }
      }
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.all = async (req, res) => {
  try {
    const region = await Region.findAll();
    if (region) {
      res.status(201).json({
        status: "SUCCESS",
        message: "Regions successfully retrieved!",
        data: region,
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
        const region = await Region.findOne({
          where: {
            id,
          },
        });
  
        if (region) {
          res.status(200).json({
            status: "SUCCESS",
            message: "Region successfully retrieved!",
            data: region,
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