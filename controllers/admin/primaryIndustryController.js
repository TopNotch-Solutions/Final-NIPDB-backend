const { where } = require("sequelize");
const PrimaryIndustry = require("../../models/primaryIndustry");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const sequelize = require("../../config/dbConfig");

exports.create = async (req, res) => {
   let { industryName, label } = req.body;
    const industryIcon = req.file?.filename;

    if (!industryName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Industry name is required.",
      });
    }
    if (!label) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Label is required.",
      });
    }

    if (!industryIcon) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Industry icon is required.",
      });
    }

  const transaction = await sequelize.transaction();
  try {
   

    industryName = CapitalizeFirstLetter(industryName);

    const existingIndustry = await PrimaryIndustry.findOne({ 
      where: { industryName }, 
      transaction 
    });
    if (existingIndustry) {
      await transaction.rollback();
      return res.status(409).json({
        status: "FAILURE",
        message: "Industry already exists!",
      });
    }

    const newIndustry = await PrimaryIndustry.create({
      industryName,
      industryIcon,
      label: label.trim()
    }, { transaction });

    await transaction.commit();
    return res.status(201).json({
      status: "SUCCESS",
      message: "Industry successfully created!",
      data: newIndustry
    });

  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const failedPath = path.join(process.cwd(), "public/primary-industries", req.file.filename);
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
    const primaryIndustries = await PrimaryIndustry.findAll();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Industries successfully retrieved!",
      data: primaryIndustries
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
        message: "ID is required"
      });
    }
  try {
    
    const primaryIndustry = await PrimaryIndustry.findByPk(id);
    if (!primaryIndustry) {
      return res.status(404).json({
        status: "SUCCESS",
        message: "Industry not found",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully retrieved!",
      data: primaryIndustry
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
    let { industryName, label } = req.body;
    if (!industryName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Industry name is required.",
      });
    }
    if (!label) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Label is required.",
      });
    }
  const transaction = await sequelize.transaction();
  try {
   
    industryName = CapitalizeFirstLetter(industryName.trim());

    const industry = await PrimaryIndustry.findByPk(id, { transaction });
    if (!industry) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided ID does not exist"
      });
    }

    if (industryName !== industry.industryName) {
      const duplicateCheck = await PrimaryIndustry.findOne({ 
        where: { industryName }, 
        transaction 
      });
      if (duplicateCheck) {
        await transaction.rollback();
        return res.status(409).json({
          status: "FAILURE",
          message: "Industry name already exists"
        });
      }
    }

    industry.industryName = industryName;
    industry.label = label.trim();
    await industry.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully updated!",
      data: industry
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

exports.updateLogo = async (req, res) => {
  const { id } = req.params;
    const industryIcon = req.file?.filename;
    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "ID is required.",
      });
    }
    if (!industryIcon) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Industry icon is required.",
      });
    }
  const transaction = await sequelize.transaction();
  try {
    
    const industry = await PrimaryIndustry.findByPk(id, { transaction });
    if (!industry) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided ID does not exist"
      });
    }

    if (industryIcon) {
      const oldIconPath = path.join(process.cwd(), "public/primary-industries", industry.industryIcon);
      if (fs.existsSync(oldIconPath)) fs.unlinkSync(oldIconPath);
      industry.industryIcon = industryIcon;
    }

    await industry.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry logo successfully updated!",
      data: industry
    });

  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const failedPath = path.join(process.cwd(), "public/primary-industries", req.file.filename);
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
    
    const industry = await PrimaryIndustry.findByPk(id, { transaction });
    if (!industry) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Industry with the provided ID does not exist"
      });
    }

    const iconPath = path.join(process.cwd(), "public/primary-industries", industry.industryIcon);
    if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);

    await industry.destroy({ transaction });
    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Industry successfully deleted!"
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