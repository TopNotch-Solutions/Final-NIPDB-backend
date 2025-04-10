const SecondaryIndustry = require('../../models/secondaryIndustry')
exports.all = async (req, res) => {
    try {
      const secondaryIndustries = await SecondaryIndustry.findAll();
      if (secondaryIndustries) {
        res.status(201).json({
          status: "SUCCESS",
          message: "Industries successfully retrieved!",
          data: secondaryIndustries,
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
        const secondaryIndustry = await SecondaryIndustry.findOne({
          where: {
            id,
          },
        });
  
        if (secondaryIndustry) {
          res.status(200).json({
            status: "SUCCESS",
            message: "industry successfully retrieved!",
            data: secondaryIndustry,
          });
        } else {
          res.status(500).json({
            status: "FAILURE",
            message: "Internal server error.",
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