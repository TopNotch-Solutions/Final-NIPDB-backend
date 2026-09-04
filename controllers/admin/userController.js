const { where } = require("sequelize");
const Admin = require("../../models/admin");
const User = require("../../models/user");
const sendErrorAlert = require('../../utils/shared/sendErrorAlert');

exports.allAdminList = async (req, res) => {
    try{
         const allAdmins = await Admin.findAll();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Admins successfully retrieved!",
      data: allAdmins || [],
    });
    } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/userController.js" });
        res.status(500).json({
          status: "FAILURE",
          message: "Something went wrong on our end. Please try again in a few moments.",
        });
      }
}
exports.allAdminListDownload = async (req, res) => {
  try{
      const allAdmins = await Admin.findAll({
      attributes: ["id", "firstName", "lastName", "email", "department", "role", "createdAt"]
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Admins successfully retrieved for download!",
      data: allAdmins || [],
    });
      
  } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/userController.js" });
      res.status(500).json({
        status: "FAILURE",
        message: "Something went wrong on our end. Please try again in a few moments.",
      });
    }
}
exports.allSystemUser = async (req, res) => {
    try{
        const totalAdmin = await Admin.count();
    const totalUser = await User.count();
    const totalTogether = totalAdmin + totalUser;

    return res.status(200).json({
      status: "SUCCESS",
      message: "Total count successfully retrieved!",
      count: totalTogether || 0,
    });
       
    } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/userController.js" });
      res.status(500).json({
        status: "FAILURE",
        message: "Something went wrong on our end. Please try again in a few moments.",
      });
    }
}
exports.superAdmincount = async (req, res) => {
    try{
       const totalSuperAdmin = await Admin.count({ where: { role: "Super admin" } });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Super admin count successfully retrieved!",
      count: totalSuperAdmin || 0,
    });
       
    } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/userController.js" });
      res.status(500).json({
        status: "FAILURE",
        message: "Something went wrong on our end. Please try again in a few moments.",
      });
    }
}
exports.allAdmincount = async (req, res) => {
    try{
      const totalAdmin = await Admin.count({ where: { role: "Admin" } });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Admin count successfully retrieved!",
      count: totalAdmin || 0,
    });
       
    } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/userController.js" });
      res.status(500).json({
        status: "FAILURE",
        message: "Something went wrong on our end. Please try again in a few moments.",
      });
    }
}
exports.appUserCount = async (req, res) => {
    try{
       const totalUser = await User.count();

    return res.status(200).json({
      status: "SUCCESS",
      message: "App user count successfully retrieved!",
      count: totalUser || 0,
    });
       
    } catch (error) {
    sendErrorAlert(error, { source: "controllers/admin/userController.js" });
      res.status(500).json({
        status: "FAILURE",
        message: "Something went wrong on our end. Please try again in a few moments.",
      });
    }
}
exports.update = async (req, res) => {}
exports.delete = async (req, res) => {}
exports.role = async (req, res) => {}
