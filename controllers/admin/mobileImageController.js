const MobileImage = require("../../models/mobileImage");
const path = require("path");
const fs = require('fs');
const sequelize = require("../../config/dbConfig");

exports.create = async (req, res) => {
  const { description } = req.body;
    const mobileImage = req.file?.filename;

    if (!description) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Description is required",
      });
    }
    if (!mobileImage) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Image is required",
      });
    }
  const transaction = await sequelize.transaction();

  try {
    

    const imageCount = await MobileImage.count({ transaction });
    if (imageCount >= 10) {
      await transaction.rollback();
      return res.status(403).json({
        status: "FAILURE",
        message: "Image limit number set to 10.",
      });
    }

    const newImage = await MobileImage.create(
      { mobileImage, description: description },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      status: "SUCCESS",
      message: "App image successfully created!",
      data: newImage,
    });

  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const failedPath = path.join(process.cwd(), "public/mobile-images", req.file.filename);
      if (fs.existsSync(failedPath)) fs.unlinkSync(failedPath);
    }
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.all = async (req, res) => {
  try {
    const mobileImages = await MobileImage.findAll();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Images successfully retrieved!",
      data: mobileImages,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.single = async (req, res) => {
  const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Image ID is required.",
      });
    }
  try {
    
    const mobileImage = await MobileImage.findByPk(id);
    if (!mobileImage) {
      return res.status(200).json({
        status: "FAILURE",
        message: "Image not found.",
        data: []
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Image successfully retrieved!",
      data: mobileImage,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
    const { description } = req.body;
    const newFile = req.file?.filename;

    if (!description) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Description is required",
      });
    }

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "ID is required",
      });
    }
  const transaction = await sequelize.transaction();

  try {
    

    const existingImage = await MobileImage.findByPk(id, { transaction });
    if (!existingImage) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Image with the provided ID does not exist.",
      });
    }

    if (newFile) {
      const oldPath = path.join(process.cwd(), "public/mobile-images", existingImage.mobileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      existingImage.mobileImage = newFile;
    }

    existingImage.description = description;
    await existingImage.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Image successfully updated!",
      data: existingImage,
    });
  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const failedPath = path.join(process.cwd(), "public/mobile-images", req.file.filename);
      if (fs.existsSync(failedPath)) fs.unlinkSync(failedPath);
    }
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "ID is required",
      });
    }
  const transaction = await sequelize.transaction();

  try {
    
    const totalImages = await MobileImage.count({ transaction });

    if (totalImages <= 1) {
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Cannot delete the last remaining mobile profile image.",
      });
    }

    const image = await MobileImage.findByPk(id, { transaction });
    if (!image) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Image with the provided ID does not exist.",
      });
    }

    const imagePath = path.join(process.cwd(), "public/mobile-images", image.mobileImage);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await image.destroy({ transaction });
    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Image successfully deleted!",
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};