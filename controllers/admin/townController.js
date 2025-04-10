const Town = require("../../models/town");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");

exports.create = async (req, res) => {
  try {
    let { townName, regionId } = req.body;
    
    if (townName === "" || regionId === "") {
        res.status(400).json({
          status: "FAILURE",
          message: "Empty input fields",
        });
    } else {
      townName = CapitalizeFirstLetter(townName);
      const town = await Town.findOne({
        where: {
          townName,
        },
      });
      if (town) {
        res.status(409).json({
          status: "FAILURE",
          message: "Town already exist!",
        });
      } else {
        const newTown = await Town.create({
            townName,
            regionId
        });
        if (newTown) {
          res.status(201).json({
            status: "SUCCESS",
            message: "Town successfully created!",
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
            message: "Town successfully retrieved!",
            data: town,
          });
        } else {
          res.status(404).json({
            status: "FAILURE",
            message: "The town provided does not exist.",
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