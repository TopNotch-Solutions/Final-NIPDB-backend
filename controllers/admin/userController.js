const { where } = require("sequelize");
const Admin = require("../../models/admin");
const User = require("../../models/user");

exports.allAdminList = async (req, res) => {
    try{
        const allAdmins = await Admin.findAll();
        if (!allAdmins) {
            return res.status(500).json({
              status: "FAILURE",
              message: "Internal server error.",
            });
          }else{
            res.status(200).json({
                status: "SUCCESS",
                message: "Admins successfully updated!",
                data: allAdmins
              });
          }
        
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
        attributes: ["id","firstName","lastName","email","department","role","createdAt"]
      });
      if (!allAdmins) {
          return res.status(500).json({
            status: "FAILURE",
            message: "Internal server error.",
          });
        }else{
          res.status(200).json({
              status: "SUCCESS",
              message: "Admins successfully updated!",
              data: allAdmins
            });
        }
      
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

        if(!totalTogether){
            return res.status(200).json({
                status: "SUCCESS",
                message: "Total count successfully retrieved!",
                count: 0,
              });
        }else{
            return  res.status(200).json({
                status: "SUCCESS",
                message: "Total count successfully retrieved!",
                count: totalTogether,
              });
        }
       
    } catch (error) {
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
      });
    }
}
exports.superAdmincount = async (req, res) => {
    try{
        const totalAdmin = await Admin.count({
            where:{
                role:"Super admin"
            }
        });


        if(!totalAdmin){
            return res.status(200).json({
                status: "SUCCESS",
                message: "Total count successfully retrieved!",
                count: 0,
              });
        }else{
            return  res.status(200).json({
                status: "SUCCESS",
                message: "Total count successfully retrieved!",
                count: totalAdmin,
              });
        }
       
    } catch (error) {
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
      });
    }
}
exports.allAdmincount = async (req, res) => {
    try{
        const totalAdmin = await Admin.count({
            where:{
                role: "Admin"
            }
        });


        if(!totalAdmin){
            return res.status(200).json({
                status: "SUCCESS",
                message: "Total count successfully retrieved!",
                count: 0,
              });
        }else{
            return  res.status(200).json({
                status: "SUCCESS",
                message: "Total count successfully retrieved!",
                count: totalAdmin,
              });
        }
       
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


        if(!totalUser){
            return res.status(200).json({
                status: "SUCCESS",
                message: "Total count successfully retrieved!",
                count: 0,
              });
        }else{
            return  res.status(200).json({
                status: "SUCCESS",
                message: "Total count successfully retrieved!",
                count: totalUser,
              });
        }
       
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
