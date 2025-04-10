const MobileImage = require("../../models/mobileImage");

exports.all = async (req, res) => {
  try {
    const mobileImage = await MobileImage.findAll();
    if (mobileImage) {
      res.status(201).json({
        status: "SUCCESS",
        message: "Images successfully retrieved!",
        data: mobileImage,
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
      const mobileImage = await MobileImage.findOne({
        where: {
          id,
        },
      });

      if (mobileImage) {
        res.status(200).json({
          status: "SUCCESS",
          message: "Bsos successfully retrieved!",
          data: mobileImage,
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
