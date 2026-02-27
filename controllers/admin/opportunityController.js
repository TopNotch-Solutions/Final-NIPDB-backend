const { where } = require("sequelize");
const fs = require('fs');
const Opportunity = require("../../models/opportunity");
const path = require("path");
const sequelize = require("../../config/dbConfig");

exports.create = async (req, res) => {
  let { description, user, link } = req.body;
    const image = req.file?.filename;

    if (!image) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Image is required",
      });
    }

    if (!user) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User is required",
      });
    }
    if (!link) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Link is required",
      });
    }

  const transaction = await sequelize.transaction();
  try {
    
    const categoryCount = await Opportunity.count({ 
      where: { user }, transaction 
    });
    if (categoryCount >= 15) {
      await transaction.rollback();
      return res.status(403).json({
        status: "FAILURE",
        message: "Opportunities limit set to 15 per category.",
      });
    }

    const existingOpportunity = await Opportunity.findOne({ 
      where: { description: description.trim() }, transaction 
    });
    if (existingOpportunity) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Opportunity already exists",
      });
    }

    const newOpportunity = await Opportunity.create({
      image,
      description: description.trim(),
      user: user.trim(),
      link,
      dateUploaded: Date.now()
    }, { transaction });

    await transaction.commit();
    return res.status(201).json({
      status: "SUCCESS",
      message: "Opportunity successfully created!",
      data: newOpportunity
    });

  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const failedPath = path.join(process.cwd(), "public/opportunities", req.file.filename);
      if (fs.existsSync(failedPath)) fs.unlinkSync(failedPath);
    }
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.all = async (req, res) => {
  try {
    const allOpportunities = await Opportunity.findAll();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunities successfully retrieved!",
      data: allOpportunities
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.single = async (req, res) => {
  const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "ID is required."
      });
    }
  try {
  
    const opportunity = await Opportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Opportunity not found."
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunity successfully retrieved!",
      data: opportunity
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.update = async (req, res) => {
   const { id } = req.params;
    const { description, user, link } = req.body;
    const newImage = req.file?.filename;
    if (!description) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Description is required"
      });
    }
     if (!user) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User is required"
      });
    }
     if (!link) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Link is required"
      });
    }

  const transaction = await sequelize.transaction();
  try {

    const existingOpportunity = await Opportunity.findByPk(id, { transaction });
    if (!existingOpportunity) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Opportunity with the provided ID does not exist."
      });
    }

    if (newImage) {
      const oldPath = path.join(process.cwd(), "public/opportunities", existingOpportunity.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      existingOpportunity.image = newImage;
    }

    existingOpportunity.description = description;
    existingOpportunity.user = user;
    existingOpportunity.link = link;

    await existingOpportunity.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunity successfully updated!",
      data: existingOpportunity
    });

  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const failedPath = path.join(process.cwd(), "public/opportunities", req.file.filename);
      if (fs.existsSync(failedPath)) fs.unlinkSync(failedPath);
    }
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
   if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "ID is required"
      });
    }
  const transaction = await sequelize.transaction();
  try {
    
    const totalOpportunities = await Opportunity.count({ transaction });

    if (totalOpportunities <= 1) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Cannot delete the last remaining opportunity."
      });
    }

    const opportunity = await Opportunity.findByPk(id, { transaction });
    if (!opportunity) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Opportunity with the provided ID does not exist."
      });
    }

    const imagePath = path.join(process.cwd(), "public/opportunities", opportunity.image);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await opportunity.destroy({ transaction });
    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Opportunity successfully deleted!"
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message
    });
  }
};