const { where } = require("sequelize");
const PrimaryIndustry = require("../../models/primaryIndustry");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");

exports.create = async (req, res) => {
  try {
    let { industryName,label} = req.body;
    let industryIcon = req.file.filename;

    if (!industryName || !label) {
      res.status(400).json({
        status: "FAILURE",
        message: "Empty input fields",
      });
    } else {
      industryName = CapitalizeFirstLetter(industryName);
      const primaryIndustry = await PrimaryIndustry.findOne({
        where: {
          industryName,
        },
      });
      if (primaryIndustry) {
        res.status(409).json({
          status: "FAILURE",
          message: "Industry already exist!",
        });
      } else {
        const newPrimaryIndustry = await PrimaryIndustry.create({
          industryName,
          industryIcon,
          label
        });
        if (newPrimaryIndustry) {
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
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    let { industryName,label } = req.body;
    industryName = CapitalizeFirstLetter(industryName);

    // Check if BSO with given ID exists
    const updatedIndustry = await PrimaryIndustry.findOne({
      where: { id },
    });

    if (!updatedIndustry) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided id does not exist.",
      });
    }

    // Check if another BSO with the updated name already exists
    if (industryName !== updatedIndustry.industryName) {
      const existingPrimaryIndustry = await PrimaryIndustry.findOne({
        where: { industryName },
      });

      if (existingPrimaryIndustry) {
        return res.status(409).json({
          status: "FAILURE",
          message: "Industry name already exists.",
        });
      }
    }

    const newUpdatedPrimaryIndustry = await PrimaryIndustry.update(
      {industryName,label},
      {where: {id}}
    );

    if (newUpdatedPrimaryIndustry) {
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

exports.updateLogo = async (req, res) => {
  try {
    let { id } = req.params;
    let { industryIcon } = req.body;

    const primaryIndustry = await PrimaryIndustry.findOne({
      where: {
        id,
      },
    });

    if (primaryIndustry) {
      const newPrimaryIndustry = await PrimaryIndustry.update(
        { industryIcon },
        {
          where: {
            id,
          },
        }
      );

      if (newPrimaryIndustry) {
        res.status(200).json({
          status: "SUCCESS",
          message: "industry logo successfully updated!",
        });
      } else {
        res.status(500).json({
          status: "FAILURE",
          message: "Internal server error.",
        });
      }
    } else {
      res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided id does not exist.",
      });
    }
  } catch (error) {
    res.status(500).json({
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
      const primaryIndustry = await PrimaryIndustry.findOne({
        where: {
          id,
        },
      });
      if (primaryIndustry) {
        await primaryIndustry.destroy({
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
