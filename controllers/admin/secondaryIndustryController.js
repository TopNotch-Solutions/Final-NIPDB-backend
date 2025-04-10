const { where } = require("sequelize");
const SecondaryIndustry = require("../../models/secondaryIndustry");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");

exports.create = async (req, res) => {
  try {
    let { industryName } = req.body;

    if (industryName == "") {
      res.status(400).json({
        status: "FAILURE",
        message: "Empty input fields",
      });
    } else {
      industryName = CapitalizeFirstLetter(industryName);
      const secondaryIndustry = await SecondaryIndustry.findOne({
        where: {
          industryName,
        },
      });
      if (secondaryIndustry) {
        res.status(409).json({
          status: "FAILURE",
          message: "Industry already exist!",
        });
      } else {
        const newSecondaryIndustry = await SecondaryIndustry.create({
          industryName,
        });
        if (newSecondaryIndustry) {
          res.status(201).json({
            status: "SUCCESS",
            message: "Industry successfully created!",
          });
        } else {
          res.status(500).json({
            status: "FAILURE",
            message: "Internal server error.",
          });
        }
      }
    }
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
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
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    let { industryName } = req.body;
    industryName = CapitalizeFirstLetter(industryName);
    
    const updatedIndustry = await SecondaryIndustry.findOne({
      where: { id },
    });

    if (!updatedIndustry) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided id does not exist.",
      });
    }

    if (industryName !== updatedIndustry.industryName) {
      const existingSecondaryIndustry = await SecondaryIndustry.findOne({
        where: { industryName },
      });

      if (existingSecondaryIndustry) {
        return res.status(409).json({
          status: "FAILURE",
          message: "Industry name already exists.",
        });
      }
    }

    const newUpdatedSecondaryIndustry = await SecondaryIndustry.update(
      { industryName },
      { where: { id } }
    );

    if (newUpdatedSecondaryIndustry) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Industry successfully updated!",
      });
    } else {
      return res.status(500).json({
        status: "FAILURE",
        message: "Failed to update industry.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
exports.delete = async (req, res) => {
  try {
    let { id } = req.params;

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
        await SecondaryIndustry.destroy({
          where: {
            id,
          },
        });
        res.status(200).json({
          status: "SUCCESS",
          message: "Industry successfully deleted!",
        });
      } else {
        res.status(404).json({
          status: "FAILURE",
          message: "Industry with the provided id does not exist.",
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
