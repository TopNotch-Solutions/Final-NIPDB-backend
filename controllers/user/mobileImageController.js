const MobileImage = require("../../models/mobileImage");

exports.all = async (req, res) => {
  try {
    const images = await MobileImage.findAll();

    if (!images || images.length === 0) {
      return res.status(200).json({
        status: "FAILURE",
        message: "No mobile images found.",
        data: []
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Mobile images retrieved successfully.",
      data: images,
    });
  } catch (error) {
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

    const image = await MobileImage.findOne({ where: { id } });

    if (!image) {
      return res.status(200).json({
        status: "FAILURE",
        message: `No mobile image found with ID: ${id}`,
        data: []
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Mobile image retrieved successfully.",
      data: image,
    });
  } catch (error) {
    console.error(`Error fetching mobile image with ID ${req.params.id}:`, error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error.",
      error: error.message,
    });
  }
};