const Admin = require("../../models/admin");
const { createWebToken } = require("../../utils/web/generateToken");
const {
  createWebRefreshToken,
} = require("../../utils/web/generateRefreshToken");
const generateRandomString = require("../../utils/shared/generateRandomString");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sendOTPVerification = require("../../utils/mobile/sendOtp");
const User = require("../../models/user");
const OTP = require("../../models/otpVerification");
const { Op, where } = require("sequelize");
const sendAdminOTPVerification = require("../../utils/web/sendAdminOtp");
require("dotenv").config();

exports.signup = async (req, res) => {
  const { firstName, lastName, email, department, contactNumber, role } =
    req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !role ||
    !department ||
    !contactNumber
  ) {
    return res
      .status(400)
      .json({ status: "FAILURE", message: "Input fields empty" });
  }

  const password = generateRandomString();
  const formattedFirstName = CapitalizeFirstLetter(firstName);
  const formattedLastName = CapitalizeFirstLetter(lastName);
  const formattedDepartment = CapitalizeFirstLetter(department);
  const formattedRole = CapitalizeFirstLetter(role);

  try {
    const existingUser = await Admin.findOne({ where: { email } });

    if (existingUser) {
      return res
        .status(409)
        .json({ status: "FAILURE", message: "Email provided already exists" });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await Admin.create({
      firstName: formattedFirstName,
      lastName: formattedLastName,
      email,
      password: hashedPassword,
      department: formattedDepartment,
      contactNumber,
      role: formattedRole,
    });
    console.log("here is the password", password)
    // const transporter = nodemailer.createTransport({
    //   host: 'smtp-relay.gmail.com',
    //   port: 25,
    //   tls: {
    //     rejectUnauthorized: false,
    //   },
    // });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth:{
        user: process.env.USERNAME,
        pass: process.env.PASSWORD
      }
      // tls: {
      //   rejectUnauthorized: false,
      // },
    });

    // const mailOptions = {
    //   from: 'in4msme@nipdb.com',
    //   to: email,
    //   subject: "In4Msme Portal Onboarding",
    //   html: `<p>${newUser.firstName} ${newUser.lastName}, Here is your password <b>${password}</b>. Do not share it with anyone.</p>`,
    // };
    const mailOptions = {
      from:  process.env.USERNAME,
      to: email,
      subject: "In4Msme Portal Onboarding",
      html: `<p>${newUser.firstName} ${newUser.lastName}, Here is your password <b>${password}</b>. Do not share it with anyone.</p>`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error("Email error:", error);
        await Admin.destroy({ where: { email } });
        return res.status(500).json({
          status: "FAILURE",
          message: "Internal server error: " + error.message,
        });
      }
      res.status(201).json({
        status: "SUCCESS",
        message: "User successfully inserted. Email sent",
      });
    });
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error", error });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(404)
      .json({ status: "FAILURE", message: "Input fields empty" });
  } else {
    try {
      const user = await Admin.findOne({
        where: {
          email: email,
        },
      });

      if (user) {
        if (user.role === "User") {
          return res.status(404).json({
            status: "FAILURE",
            message: "User does not have access to this route",
          });
        }
        const existingUser = await bcrypt.compare(password, user.password);

        if (existingUser) {

          console.log(user)
          await sendAdminOTPVerification(
            { id: user.id, email: user.email},
            res,
            { subject: "IN4MSME Two Factor Authentication" }
          );
        
        } else {
          return res
            .status(404)
            .json({ status: "FAILURE", message: "Invalid credentials",isAuthenticated: false });
        }
      } else {
        return res
          .status(404)
          .json({ status: "FAILURE", message: "Invalid credentials",isAuthenticated: false });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: "FAILURE", message: "Internal Server Error" });
    }
  }
};
exports.verifyAdminOTP = async (req, res) => {
  const { otp, userId } = req.body;
  const role = "Admin";

  if (!userId || !otp) {
    return res
      .status(400)
      .json({ status: "FAILURE", message: "Input fields empty" });
  }

  const verifyUser = await OTP.findOne({
    where: { userId, role },
  });

  if (!verifyUser) {
    return res.status(404).json({
      status: "FAILURE",
      message: "Invalid OTP",
    });
  }

  const { expiresAt, otp: hashedOTP } = verifyUser;

  if (expiresAt < Date.now()) {
    await OTP.destroy({
      where: { userId, role },
    });
    return res.status(400).json({
      status: "FAILURE",
      message: "Code has expired. Please request again.",
    });
  }

  const validOTP = await bcrypt.compare(otp, hashedOTP);

  if (!validOTP) {
    return res.status(400).json({
      status: "FAILURE",
      message: "Invalid code. Please check your inbox.",
    });
  }

  await OTP.destroy({
    where: { userId, role },
  });

  const user = await Admin.findOne({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({
      status: "FAILURE",
      message: "User not found",
    });
  }


  const token = createWebToken(user.id, user.role);
  console.log(token)
  if (token) {
    const currentUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      profileImage: user.profileImage,
      contactNumber: user.contactNumber,
      token: token,
      role: user.role,
    };


    return res.status(200).json({
      status: "SUCCESS",
      message: "Login successful",
      currentUser,
    });
  } else {
    return res
      .status(500)
      .json({ status: "FAILURE", message: "Server could not generate token" });
  }
};

exports.currentUser = async (req, res) => {
  try {
    const { id } = req.user;
    const currentUser = await Admin.findOne({
      where: {
        id,
      },
    });
    if (currentUser) {
      
      const token = createWebToken(currentUser.id, currentUser.role);
      if (token) {
        const newUser = {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          department: currentUser.department,
          profileImage: currentUser.profileImage,
          contactNumber: currentUser.contactNumber,
          token: token,
          role: currentUser.role,
        };
        res.status(200).json({
          status: "SUCCESS",
          message: "Login successful",
          currentUser: newUser,
        });
      } else {
        return res
          .status(500)
          .json({ message: "Server could not generate token" });
      }
    } else {
      res.status(404).json({
        status: "FAUILURE",
        message: "The user does not exist",
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.adminEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email ) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Input fields empty",
      });
    }

    const existingAdmin = await Admin.findOne({
      where: {
        email,
      },
    });

    if (!existingAdmin) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Admin not found!",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Admin details successfully retrieved!",
      data: existingAdmin,
    });
  } catch (error) {
    console.error("Error retrieving admin details:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error",
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await Admin.findOne({
      where: {
        email,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }
    let userId = existingUser.id;
    const subject = "In4MSME Forgot Password Verification";
    await sendOTPVerification({ id: userId, email, role: "Admin" }, res, {
      subject,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.changePassword = async (req, res) => {
  try {
    let { id } = req.user;
    let { currentPassword, newPassword, confirmPassword } = req.body;
    console.log(confirmPassword, newPassword, confirmPassword);
    if (!currentPassword || !newPassword || !confirmPassword || !id) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await Admin.findOne({
      where: {
        id,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }
    const isExisting = await bcrypt.compare(
      currentPassword,
      existingUser.password
    );
    if (!isExisting) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Invalid current password!",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(404).json({
        status: "FAILURE",
        message: "New password and the Confirm password provided do not match.",
      });
    }
    const salt = await bcrypt.genSalt();
    const newPasswordHashed = await bcrypt.hash(newPassword, salt);
    await Admin.update(
      { password: newPasswordHashed },
      {
        where: {
          id,
        },
      }
    );
    res.status(200).json({
      status: "SUCCESS",
      message: "User Password successfully updated",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: `Internal Server Error: ${error} ` });
  }
};
exports.newPassword = async (req, res) => {
  try {
    const { userId, token, newPassword, confirmPassword } = req.body;

    if (!userId || !token || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }

    const otpRecord = await OTP.findOne({
      where: {
        userId: userId,
        expiresAt: {
          [Op.gt]: new Date(), 
        },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Invalid or expired token.",
      });
    }
    const isTokenValid = await bcrypt.compare(token, otpRecord.otp);
    if (!isTokenValid) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Invalid or expired token.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "FAILURE",
        message: "New password and confirm password do not match.",
      });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await Admin.update(
      { password: hashedPassword },
      { where: { id: userId } }
    );

    await OTP.destroy({ where: { userId: userId } });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "FAILURE",
      message: `Internal Server Error: ${error.message}`,
    });
  }
};

exports.details = async (req, res) => {
  try {
    let { id } = req.user;
    let { firstName, lastName, email, contactNumber, department} = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !contactNumber ||
      !department ||
      !id
    ) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await Admin.findOne({
      where: {
        id,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }
    const newAdminDetails = await Admin.update(
      { firstName, lastName, email, contactNumber, department },
      {
        where: {
          id,
        },
      }
    );
    if (!newAdminDetails) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Something went wrong during details update",
      });
    }
    const newD = await Admin.findOne({
      where: {
        id,
      },
    });
    const newToken = req.headers['x-access-token'];
    const newUser = {
      id: newD.id,
      firstName: newD.firstName,
      lastName: newD.lastName,
      email: newD.email,
      department: newD.department,
      profileImage: newD.profileImage,
      contactNumber: newD.contactNumber,
      token: newToken,
      role: newD.role,
    };
    res.status(200).json({
      status: "SUCCESS",
      message: "Admin details successfully updated!",
      currentUser: newUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.detailsUser = async (req, res) => {
  try {
    let { id } = req.params;
    let { firstName, lastName, email, contactNumber, department,role} = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !contactNumber ||
      !department ||
      !role ||
      !id
    ) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await Admin.findOne({
      where: {
        id,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }
    const newAdminDetails = await Admin.update(
      { firstName, lastName, email, contactNumber, department,role },
      {
        where: {
          id,
        },
      }
    );
    if (!newAdminDetails) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Something went wrong during details update",
      });
    }
    const newD = await Admin.findOne({
      where: {
        id,
      },
    });
    const newUser = {
      id: newD.id,
      firstName: newD.firstName,
      lastName: newD.lastName,
      email: newD.email,
      department: newD.department,
      profileImage: newD.profileImage,
      contactNumber: newD.contactNumber,
      role: newD.role,
    };
    res.status(200).json({
      status: "SUCCESS",
      message: "Admin details successfully updated!",
      currentUser: newUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.profileImage = async (req, res) => {
  try {
    let { id } = req.params;
    let { profileImage } = req.body;
    if (!profileImage || !id) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await Admin.findOne({
      where: {
        id,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }
    const newAdminDetails = await Admin.update(
      { profileImage },
      {
        where: {
          id,
        },
      }
    );
    if (!newAdminDetails) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Something went wrong during details update",
      });
    }
    const newD = await Admin.findOne({
      where: {
        id,
      },
    });
    const newUser = {
      id: newD.id,
      firstName: newD.firstName,
      lastName: newD.lastName,
      email: newD.email,
      department: newD.department,
      profileImage: newD.profileImage,
      contactNumber: newD.contactNumber,
      role: newD.role,
    };
    res.status(200).json({
      status: "SUCCESS",
      message: "Profile image successfully updated!",
      profileImage: newUser.profileImage,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 1 });
    res.cookie("refreshToken", "", { maxAge: 1 });
    res.status(200).json({ status: "SUCCESS", message: "User logged out" });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.delete = async (req, res) => {
  try {
    const { id } = req.user; 
    const { email } = req.body;

    if (!email || !id) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }

    const existingUser = await Admin.findOne({
      where: { email },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "Admin not found!" });
    }

    await Admin.destroy({
      where: { email },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Admin successfully deleted",
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
