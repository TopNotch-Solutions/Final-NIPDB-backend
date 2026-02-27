const { where } = require("sequelize");
const Admin = require("../../models/admin");
const User = require("../../models/user");

exports.allAdminList = async (req, res) => {
    try{
         const allAdmins = await Admin.findAll();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Admins successfully retrieved!",
      data: allAdmins || [],
    });
    } catch (error) {
        res.status(500).json({
          status: "FAILURE",
          message: "Internal server error: " + error.message,
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
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
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
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
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
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
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
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
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
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
      });
    }
}
exports.update = async (req, res) => {}
exports.delete = async (req, res) => {}
exports.role = async (req, res) => {}
