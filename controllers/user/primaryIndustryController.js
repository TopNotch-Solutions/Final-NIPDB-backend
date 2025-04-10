const PrimaryIndustry = require('../../models/primaryIndustry');
exports.all = async (req, res) => {
    try {
      const primaryIndustries = await PrimaryIndustry.findAll();
      if (primaryIndustries) {
        res.status(201).json({
          status: "SUCCESS",
          message: "Industries successfully retrieved!",
          data: primaryIndustries,
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
  exports.allIndustryName = async (req, res) => {
    try {
      const primaryIndustries = await PrimaryIndustry.findAll({
        attributes: ['id', 'industryName']
      });
      if (primaryIndustries) {
        res.status(200).json({
          status: "SUCCESS",
          message: "Industries successfully retrieved!",
          data: primaryIndustries,
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
  }
  exports.single = async (req, res) => {
    try {
      const id = req.params.id;
  
      if (id === "") {
        res.status(400).json({
          status: "FAILURE",
          message: "Empty parameter",
        });
      } else {
        const primaryIndustry = await PrimaryIndustry.findOne({
          where: {
            id,
          },
        });
  
        if (primaryIndustry) {
          res.status(200).json({
            status: "SUCCESS",
            message: "industry successfully retrieved!",
            data: primaryIndustry,
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

  exports.allWithoutIcon = async (req, res) => {
    try {
      const primaryIndustries = await PrimaryIndustry.findAll({
        attributes: ['id', 'industryName', 'label'], 
      });
      if (primaryIndustries) {
        res.status(200).json({
          status: "SUCCESS",
          message: "Industries successfully retrieved without icons!",
          data: primaryIndustries,
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
  