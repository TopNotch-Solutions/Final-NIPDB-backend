const { where } = require('sequelize');
const Opportunity = require('../../models/opportunity');

exports.allGeneral = async (req, res) => {
    try {
      const allOpportunities = await Opportunity.findAll({
        where:{
          user:"General User"
        }
      });
      if (allOpportunities) {
        res.status(201).json({
          status: "SUCCESS",
          message: "Opportunities successfully retrieved!",
          data: allOpportunities,
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
  exports.singleGeneral = async (req, res) => {
    try {
      const id = req.params.id;
  
      if (id === "") {
        res.status(400).json({
          status: "FAILURE",
          message: "Empty parameter",
        });
      } else {
        const allOpportunity = await Opportunity.findOne({
          where: {
            id,
            user:"General User"
          },
        });
  
        if (allOpportunity) {
          res.status(200).json({
            status: "SUCCESS",
            message: "Opportunity successfully retrieved!",
            data: allOpportunity,
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
  exports.allBusiness = async (req, res) => {
    try {
      const allOpportunities = await Opportunity.findAll({
        where:{
          user:"Business User"
        }
      });
      if (allOpportunities) {
        res.status(201).json({
          status: "SUCCESS",
          message: "Opportunities successfully retrieved!",
          data: allOpportunities,
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
  exports.singleBusiness = async (req, res) => {
    try {
      const id = req.params.id;
  
      if (id === "") {
        res.status(400).json({
          status: "FAILURE",
          message: "Empty parameter",
        });
      } else {
        const allOpportunity = await Opportunity.findOne({
          where: {
            id,
            user:"Business User"
          },
        });
  
        if (allOpportunity) {
          res.status(200).json({
            status: "SUCCESS",
            message: "Opportunity successfully retrieved!",
            data: allOpportunity,
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