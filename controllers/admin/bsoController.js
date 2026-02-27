const BSO = require("../../models/bso");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const path = require("path");
const fs = require('fs');
const sequelize = require("../../config/dbConfig");
const { Op } = require("sequelize");

exports.create = async (req, res) => {
  let { name, type, contactNumber, website, email, description } = req.body;
    const logo = req.file ? req.file.filename : null;

    if (!name) {
      return res.status(400).json({
        status: "FAILURE",
        message: "BSO name is required.",
      });
    }
    if (!type) {
      return res.status(400).json({
        status: "FAILURE",
        message: "BSO type is required.",
      });
    }
    if (!contactNumber) {
      return res.status(400).json({
        status: "FAILURE",
        message: "BSO contact number is required.",
      });
    }
    if (!website) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Website is required.",
      });
    }
    
    if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Email is required.",
      });
    }
    if (!description) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Description is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {
    name = CapitalizeFirstLetter(name);
    type = CapitalizeFirstLetter(type);
    description = CapitalizeFirstLetter(description);

    const existingBso = await BSO.findOne({
      where: { name },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existingBso) {
      await transaction.rollback();
      return res.status(409).json({
        status: "FAILURE",
        message: "BSO already exists!",
      });
    }

    const newBso = await BSO.create(
      {
        name,
        type,
        contactNumber,
        website,
        email,
        description,
        logo,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      status: "SUCCESS",
      message: "BSO successfully created!",
      data: newBso,
    });

  } catch (error) {
    await transaction.rollback();
     console.error("Creating BSO error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.all = async (req, res) => {
  try {
    let { page = 1, limit = 20, sortBy = "createdAt", order = "DESC" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    const { count, rows } = await BSO.findAndCountAll({
      limit,
      offset,
      order: [[sortBy, order.toUpperCase()]],
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "BSOs retrieved successfully",
      data: rows,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.allDownload = async (req, res) => {
  try {
    let { page = 1, limit = 20, sortBy = "createdAt", order = "DESC" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    const { count, rows } = await BSO.findAndCountAll({
      attributes: ["id", "name", "type", "contactNumber", "website", "email"],
      limit,
      offset,
      order: [[sortBy, order.toUpperCase()]],
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "BSOs retrieved successfully for download",
      data: rows,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
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
        message: "BSO ID is required.",
      });
    }
  try {
    
    const bso = await BSO.findByPk(id);

    if (!bso) {
      return res.status(200).json({
        status: "FAILURE",
        message: "BSO not found.",
        data: []
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "BSO successfully retrieved!",
      data: bso,
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
let { name, type, contactNumber, website, email, description } = req.body;
    const newLogo = req.file ? req.file.filename : null;
    if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID is required.",
      });
    }

    if (!name) {
      return res.status(400).json({
        status: "FAILURE",
        message: "BSO name is required.",
      });
    }
    if (!type) {
      return res.status(400).json({
        status: "FAILURE",
        message: "BSO type is required.",
      });
    }
    if (!contactNumber) {
      return res.status(400).json({
        status: "FAILURE",
        message: "BSO contact number is required.",
      });
    }
    if (!website) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Website is required.",
      });
    }
    
    if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Email is required.",
      });
    }
    if (!description) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Description is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {
    
    const bso = await BSO.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!bso) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "BSO with the provided ID does not exist.",
      });
    }

    if (name) name = CapitalizeFirstLetter(name);
    if (type) type = CapitalizeFirstLetter(type);
    if (description) description = CapitalizeFirstLetter(description);

    if (name && name !== bso.name) {
      const existingBso = await BSO.findOne({
        where: { name },
        transaction,
      });

      if (existingBso) {
        await transaction.rollback();
        return res.status(409).json({
          status: "FAILURE",
          message: "BSO name already exists.",
        });
      }
    }

    if (newLogo) {
      const oldLogoPath = path.join(process.cwd(), "public/bsos", bso.logo);

      if (bso.logo && fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }

      bso.logo = newLogo;
    }

    await bso.update(
      {
        name: name ?? bso.name,
        type: type ?? bso.type,
        contactNumber: contactNumber ?? bso.contactNumber,
        website: website ?? bso.website,
        email: email ?? bso.email,
        description: description ?? bso.description,
        logo: bso.logo,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "BSO successfully updated!",
      data: bso,
    });

  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const failedPath = path.join(process.cwd(), "public/bsos", req.file.filename);
      if (fs.existsSync(failedPath)) {
        fs.unlinkSync(failedPath);
      }
    }

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.totalBsos = async (req, res) => {
  try {
    const totalBso = await BSO.count();

    return res.status(200).json({
      status: "SUCCESS",
      message: "BSO count successfully retrieved!",
      data: totalBso || 0,
    });

  } catch (error) {
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
      await transaction.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "BSO ID is required.",
      });
    }
  const transaction = await sequelize.transaction();

  try {
   
    const bso = await BSO.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!bso) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "BSO with the provided ID does not exist.",
      });
    }

    if (bso.logo) {
      const logoPath = path.join(process.cwd(), "public/bsos", bso.logo);

      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    await bso.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "BSO successfully deleted!",
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

