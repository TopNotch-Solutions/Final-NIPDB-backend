const { where } = require("sequelize");
const fs = require('fs');
const Opportunity = require("../../models/opportunity");
const path = require("path");

exports.create = async (req, res) => {
  try {
    let {description,user,link } = req.body;
    let image = req.file.filename;

    if (!image|| !description || !user) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty input fields",
      });
    }
    const generalUserCount = await Opportunity.count(
    {
      where:{
        user: "General User"
      }
    }
    );
    const buisnessUserCount = await Opportunity.count(
      {
        where:{
          user: "Business User"
        }
      }
      );
      if(generalUserCount > 15  || buisnessUserCount > 15){
        return res.status(403).json({
          status: "FAILURE",
          message: "Opportunities limit set to 15 per category.",
        });
      }
    const existingOpportunity = await Opportunity.findOne({
        where:{
            description
        }
    });
    if(existingOpportunity){
        return res.status(400).json({
            status: "FAILURE",
            message: "Opportunity already exist",
          });
    }

    const newOpportunity = await Opportunity.create({
      image,
      description,
      user,
      link,
      dateUploaded: Date.now()
    });

    if (newOpportunity) {
      return res.status(201).json({
        status: "SUCCESS",
        message: "Opportunity successfully created!",
      });
    } else {
      return res.status(500).json({
        status: "FAILURE",
        message: "Internal server error.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.all = async (req, res) => {
  try {
    const allOpportunities = await Opportunity.findAll();
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
exports.single = async (req, res) => {
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
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, user, link } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!description || !user) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty input fields",
      });
    }

    const existingOpportunity = await Opportunity.findOne({ where: { id } });

    if (!existingOpportunity) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Opportunity with the provided id does not exist.",
      });
    }

    if (image) {
      // Delete the old image if a new one is provided
      const oldImagePath = path.join(__dirname, '../../public/opportunities', existingOpportunity.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      await Opportunity.update(
        { image, description, user, link },
        { where: { id } }
      );
    } else {
      // Update only description, user, and link if no new image is provided
      await Opportunity.update(
        { description, user, link },
        { where: { id } }
      );
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunity successfully updated!",
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const opportunityCount = await Opportunity.count();

    if (opportunityCount === 1) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Cannot delete the last remaining opportunity.",
      });
    }
    const opportunity = await Opportunity.findOne({ where: { id } });

    if (!opportunity) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Opportunity with the provided id does not exist.",
      });
    }

    const imagePath = path.join(__dirname, '../../public/opportunities', opportunity.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Opportunity.destroy({ where: { id } });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunity successfully deleted!",
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};