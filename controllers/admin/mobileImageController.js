const MobileImage = require("../../models/mobileImage");
const path = require("path");
const fs = require('fs');

exports.create = async (req, res) => {
  try {
    const { description } = req.body;
    const mobileImage = req.file.filename;

    if (!mobileImage || !description) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty input fields",
      });
    }

    const imageCount = await MobileImage.count();

    if (imageCount > 10) {
      return res.status(403).json({
        status: "FAILURE",
        message: "Image limit number set to 10.",
      });
    }

    const newImage = await MobileImage.create({
      mobileImage,
      description
    });

    if (newImage) {
      return res.status(201).json({
        status: "SUCCESS",
        message: "App image successfully created!",
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
    const mobileImages = await MobileImage.findAll();
    if (mobileImages) {
      res.status(200).json({
        status: "SUCCESS",
        message: "Images successfully retrieved!",
        data: mobileImages,
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

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty parameter",
      });
    }

    const mobileImage = await MobileImage.findOne({
      where: { id },
    });

    if (mobileImage) {
      res.status(200).json({
        status: "SUCCESS",
        message: "Image successfully retrieved!",
        data: mobileImage,
      });
    } else {
      res.status(404).json({
        status: "FAILURE",
        message: "Image not found.",
      });
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
    const { description } = req.body;
    const mobileImage = req.file ? req.file.filename : null;

    if (!description) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Empty input fields",
      });
    }

    const existingImage = await MobileImage.findOne({ where: { id } });

    if (!existingImage) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Image with the provided id does not exist.",
      });
    }

    if (mobileImage) {
      // Delete old image if a new one is provided
      const oldImagePath = path.join(__dirname, '../../public/mobile-images', existingImage.mobileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      // Update with new image and description
      await MobileImage.update(
        { mobileImage, description },
        { where: { id } }
      );
    } else {
      // Update only description if no new image is provided
      await MobileImage.update(
        { description },
        { where: { id } }
      );
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Image successfully updated!",
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
    const mobileImageCount = await MobileImage.count();

    if (mobileImageCount === 1) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Cannot delete the last remaining mobile profile image.",
      });
    }
    const mobileImage = await MobileImage.findOne({
      where: { id },
    });

    if (!mobileImage) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Image with the provided id does not exist.",
      });
    }

    // Delete associated image
    const imagePath = path.join(__dirname, '../../public/mobile-images', mobileImage.mobileImage);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await MobileImage.destroy({ where: { id } });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Image successfully deleted!",
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

