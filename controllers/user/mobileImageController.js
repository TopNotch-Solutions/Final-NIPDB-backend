const MobileImage = require("../../models/mobileImage");
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');
const { getCache, setCache } = require('../../utils/shared/cacheService');

exports.all = async (req, res) => {
  try {
    const cachedImages = await getCache("mobile_image:all");
    if (cachedImages) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Mobile images retrieved successfully.",
        data: cachedImages,
      });
    }

    const images = await MobileImage.findAll();

    if (!images || images.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No mobile images found.",
        data: []
      });
    }

    await setCache("mobile_image:all", images);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Mobile images retrieved successfully.",
      data: images,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/mobileImageController.js" });
    console.error("Error fetching all mobile images:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.single = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Mobile image ID is required.",
      });
    }

    const cachedImage = await getCache(`mobile_image:${id}`);
    if (cachedImage) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Mobile image retrieved successfully.",
        data: cachedImage,
      });
    }

    const image = await MobileImage.findOne({ where: { id } });

    if (!image) {
      return res.status(200).json({
        status: "FAILURE",
        message: `No mobile image found with ID: ${id}`,
        data: []
      });
    }

    await setCache(`mobile_image:${image.id}`, image);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Mobile image retrieved successfully.",
      data: image,
    });
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/user/mobileImageController.js" });
    console.error(`Error fetching mobile image with ID ${req.params.id}:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};
