const User = require("../../models/user");
const { createMobileToken, createAppUserToken } = require("../../utils/mobile/generateToken");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const adminFirebase = require("../../config/firebaseConfig")
const OTP = require("../../models/otpVerification");
const sendOTPVerification = require("../../utils/mobile/sendOtp");
const { where, Op } = require("sequelize");
const OldUser = require("../../models/oldUsers");
const OldBusinessInformation = require("../../models/oldBusinessInformations");
const MsmeAdditionalInfo = require("../../models/msmeAdditionalInfo");
const PrimaryIndustry = require("../../models/primaryIndustry");
const MsmeContactInfo = require("../../models/msmeContactInfo");
const MsmeFounderInfo = require("../../models/msmeFounder");
const MsmeInformation = require("../../models/msmeInformation");
const BusinessHour = require("../../models/businessHour");
const DeviceToken = require("../../models/deviceToken");
const FcmToken = require("../../models/fcmToken");

exports.signup = async (req, res) => {
  let { firstName, lastName, email, password } = req.body;
  let profileImage = req.file ? req.file.filename : null;
  const role = "User";

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Input fields empty" });
  }

  firstName = CapitalizeFirstLetter(firstName);
  lastName = CapitalizeFirstLetter(lastName);

  try {
    const checkNewUser = await User.findOne({ where: { email } });

    if (checkNewUser) {
      if (!checkNewUser.verified) {
        const subject = "In4MSME OTP Verification";
        await sendOTPVerification(checkNewUser, res, { subject });
      } else {
        return res.status(409).json({
          status: "FAILURE",
          message: "Email already exists",
          data: checkNewUser.id,
        });
      }
    } else {
      const salt = await bcrypt.genSalt();
      const newPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        firstName,
        lastName,
        email,
        password: newPassword,
        profileImage,
        role,
        isMigratedUser: false,
      });

      if (newUser) {
        const subject = "In4MSME OTP Verification";
        await sendOTPVerification(
          { id: newUser.id, email: newUser.email, role: "User" },
          res,
          { subject }
        );
      } else {
        return res.status(500).json({
          status: "FAILURE",
          message: "Failed to create new user",
        });
      }
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error", error });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { otp, userId, role } = req.body;

    if (!userId || !otp || !role) {
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
        message:
          "Account record doesn't exist or has been verified already. Please sign up or login.",
      });
    }

    const { expiresAt, otp: hashedOTP } = verifyUser;
    console.log(verifyUser);

    if (role === "User") {
      if (new Date(expiresAt).getTime() < Date.now()) {
        await OTP.destroy({
          where: { userId, role },
        });
        return res.status(400).json({
          status: "FAILURE",
          message: "Code has expired. Please request again.",
        });
      }
    } else {
      if (new Date(expiresAt).getTime() < Date.now()) {
        await OTP.destroy({
          where: { userId, role },
        });
        return res.status(400).json({
          status: "FAILURE",
          message: "Link has expired.",
        });
      }
    }

    const validOTP = await bcrypt.compare(otp, hashedOTP);

    if (!validOTP) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Invalid code passed. Check your inbox.",
      });
    }

    if (role === "User") {
      await User.update({ verified: true }, { where: { id: userId } });
      await OTP.destroy({
        where: { userId, role },
      });

      return res.status(200).json({
        status: "VERIFIED",
        message: "Operation successful based on the role.",
      });
    }
    {
      await OTP.destroy({
        where: { userId, role },
      });
      return res.status(200).json({
        status: "VERIFIED",
        message: "Link is valid.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
exports.verifyForgotOTP = async (req, res) => {
  try {
    const { otp, userId } = req.body;
    console.log(otp, userId);
    if (!userId || !otp) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }

    const verifyUser = await OTP.findOne({
      where: { userId },
    });

    if (!verifyUser) {
      return res.status(404).json({
        status: "FAILURE",
        message:
          "Account record doesn't exist or has been verified already. Please sign up or login.",
      });
    }

    const { expiresAt, otp: hashedOTP } = verifyUser;

    if (expiresAt < Date.now()) {
      await OTP.destroy({
        where: { userId },
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
        message: "Invalid code passed. Check your inbox.",
      });
    }
    await OTP.destroy({
      where: { userId },
    });

    return res.status(200).json({
      status: "VERIFIED",
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "FAILURE",
      message: `Internal Server Error: ${error.message}`,
    });
  }
};
exports.resendOTP = async (req, res) => {
  try {
    const { email, userId } = req.body;

    if (!userId || !email) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    await OTP.destroy({
      where: {
        userId,
      },
    });
    const subject = "In4MSME OTP Resend Verification";
    await sendOTPVerification({ id: userId, email, role: "User" }, res, {
      subject,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await User.findOne({
      where: {
        email,
      },
    });

    await OTP.destroy({
      where: {
        userId: existingUser.id,
      },
    });
    const subject = "In4MSME OTP Verification";
    await sendOTPVerification(
      { id: existingUser.id, email, role: "User" },
      res,
      {
        subject,
      }
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.login = async (req, res) => {
  const { email, password, deviceToken, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "FAILURE", message: "Input fields empty" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ status: "FAILURE", message: "This account doesn't exist. Enter a different account or sign up." });
    }

    if (user.isMigratedUser) {
      return res.status(400).json({ status: "FAILURE", message: "Password reset required. Please tap 'Forgot Password' to set up a new password." });
    }
    if(!user.verified){
      const subject = "In4MSME Account Verification";
    await sendOTPVerification({ id: user.id, email, role: "User" }, res, {
      subject,
    });
    }else{
      if (!deviceToken || !role) {
        return res.status(400).json({ status: "FAILURE", message: "Input fields empty" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({ status: "FAILURE", message: "Invalid credentials" });
    }

    if (user.role === "Admin" || user.role === "Super admin") {
      return res.status(403).json({ status: "FAILURE", message: "User does not have access to this route" });
    }
    
    await FcmToken.upsert({
      deviceToken,
      role,
      userId: user.id,
    });

    const currentUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
    };

    const token = createMobileToken(currentUser.id, currentUser.role);

    if (token) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Login successful",
        token,
        currentUser,
      });
    }

    return res.status(500).json({ status: "FAILURE", message: "Token generation failed" });
    }

    

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.dataToken = async (req, res) => {
  try {
    
    const token = createAppUserToken();
    if (token) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "App data token successful retrieved",
        token,
      });
      
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "FAILURE", message: "Internal Server Error" });
  };
};

exports.forgotPasswordEmail = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await User.findOne({
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
    console.log(userId);
    const subject = "In4MSME Forgot Password Verification";
    await sendOTPVerification({ id: userId, email, role: "User" }, res, {
      subject,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.validateUser = async (req, res) => {
  try {
    let { email } = req.params;

    if (!email) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Email is empty" });
    }
    const existingUser = await User.findOne({
      where: {
        email,
        isMigratedUser: true,
      },
    });

    if (existingUser) {
      res.status(200).json({
        status: "SUCCESS",
        returningUser: true,
        message: "Returning user",
      });
    } else {
      res.status(200).json({
        status: "FAILURE",
        returningUser: false,
        message: "Not Returning user",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error ", error });
  }
};
exports.validateUpdate = async (req, res) => {
  try {
    let id = req.user.id;

    if (!id) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "ID is empty" });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { firstName: { [Op.or]: [null, ""] } },
          { lastName: { [Op.or]: [null, ""] } },
          { password: { [Op.or]: [null, ""] } },
        ],
        id,
      },
    });

    if (existingUser) {
      res.status(200).json({
        status: "SUCCESS",
        updateDetails: true,
        message: "User needs to update their details",
      });
    } else {
      res.status(200).json({
        status: "FAILURE",
        updateDetails: false,
        message: "Does not need to update their details",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error ", error });
  }
};
exports.userDetails = async (req, res) => {
  try {
    let id = req.user.id;

    if (!id) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "ID is empty" });
    }

    const existingUser = await User.findOne({
      where: {
        id,
      },
      attributes: ["id", "firstName", "lastName", "email", "profileImage"],
    });

    if (existingUser) {
      res.status(200).json({
        status: "SUCCESS",
        data: existingUser,
        message: "User details successfully retrieved",
      });
    } else {
      res.status(400).json({
        status: "FAILURE",
        message: "User not found!",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error ", error });
  }
};
exports.migrate = async (req, res) => {
  try {
    const oldUsers = await OldUser.findAll();

    for (const oldUser of oldUsers) {
      const newUser = await User.create({
        firstName: oldUser.first_name,
        lastName: oldUser.last_name,
        email: oldUser.user_email,
        password: null,
        role: "User",
        verified: true,
        isMigratedUser: true,
      });

      const oldBusinesses = await OldBusinessInformation.findAll({
        where: { author_email: oldUser.user_email },
      });

      for (const oldBusiness of oldBusinesses) {
        const msmeInfo = await MsmeInformation.create({
          businessRegistrationName: CapitalizeFirstLetter(oldBusiness.title),
          businessDisplayName: CapitalizeFirstLetter(oldBusiness.title),
          annualTurnover: "",
          description: "",
          status: "Incomplete",
          userId: newUser.id,
        });

        await MsmeFounderInfo.create({ businessId: msmeInfo.id });

        await MsmeContactInfo.create({
          businessId: msmeInfo.id,
          email: oldBusiness.author_email,
          whatsAppNumber: "",
          website: "",
          twitter: "",
          facebook: "",
          instagram: "",
          linkedIn: ""
        });
        const businessIcon = await PrimaryIndustry.findOne({
          order: [["id", "ASC"]],
        });

        let businessLogo = null;
        if (businessIcon) {
          const sourcePath = path.join(
            "public",
            "primary-industries",
            businessIcon.industryIcon
          );
          const destPath = path.join(
            "public",
            "msmes",
            businessIcon.industryIcon
          );

          if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            businessLogo = businessIcon.industryIcon;
          }
        }

        await MsmeAdditionalInfo.create({
          businessId: msmeInfo.id,
          businessLogo,
          numberOfEmployees: ""
        });

        await BusinessHour.create({ businessId: msmeInfo.id });
      }
    }
    res
      .status(201)
      .json({ status: "SUCCESS", message: "Data successfully migrated " });
    console.log("User and business data migrated successfully");
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error ", error });
  }
};
exports.test = async (req, res) => {
  try {
    const message = {
      notification: {
        title: "New Message",
        body: "We are testing",
      },
      data: {
        route: "/MessagesMsme",
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
      token: "fiHL3Z9bTTSDsPNftf2M8z:APA91bGFuyuK2HrYEZDoyfFcpazgeg-GPVdwvmKmzjwIWkxQXg_LMAXGk8CnJ0jrFulVigsqsteJWHArCo9C7tT7bm6jEu3p1qT5MTE89jUufm_sVj6ya4k"
    };

    await adminFirebase.messaging().send(message)
      .then(() => {
        res.status(200).json({
          status: "SUCCESS",
          message: "Notification sent successfully."
        });
      })
      .catch((firebaseError) => {
        console.error("Firebase error:", firebaseError);
        if (firebaseError.code === "messaging/registration-token-not-registered") {
          // Remove unregistered token logic here
          // ...
        }
      });
  } catch (error) {
    res.status(500).json({ status: "FAILURE", message: "Internal Server Error", error });
  }
};

exports.forgotPasswordNewPassword = async (req, res) => {
  try {
    let { newPassword, confirmPassword, userId } = req.body;

    if (!newPassword || !confirmPassword || !userId) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(404).json({
        status: "FAILURE",
        message: "New password and the Confirm password provided do not match.",
      });
    }
    const salt = await bcrypt.genSalt();
    const newPasswordHashed = await bcrypt.hash(newPassword, salt);

    await User.update(
      { password: newPasswordHashed, isMigratedUser: false },
      {
        where: {
          id: userId,
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
      .json({ status: "FAILURE", message: "Internal Server Error ", error });
  }
};

exports.forgotPasswordResendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await User.findOne({
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
    await OTP.destroy({
      where: {
        userId,
      },
    });
    const subject = "In4MSME Forgot Password Resend OTP Verification";
    await sendOTPVerification({ id: userId, email, role: "User" }, res, {
      subject,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.register = async (req, res) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Device token is null or empty" });
    }
    const existingToken = await DeviceToken.findOne({
      where: {
        deviceToken,
      },
    });
    if (existingToken) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "Device token already in use" });
    }

    await DeviceToken.create({
      deviceToken,
      enabled:true
    });
    res.status(201).json({
      status: "SUCCESS",
      message: "Device token successfully registered",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error: " });
  }
};
exports.registerDeviceToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceToken, role } = req.body;

    if (!deviceToken || !userId || !role) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Empty input field" });
    }
    const existingToken = await FcmToken.findOne({
      where: {
        deviceToken,
        role
      },
    });
    if (existingToken) {
      await FcmToken.destroy({
        where:{
        deviceToken,
        role
        }
      });
    }

    await FcmToken.create({
      userId,
      deviceToken,
      role
    });
    res.status(201).json({
      status: "SUCCESS",
      message: "Device token successfully registered",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error: ",error });
  }
};
exports.fcmToken = async (req, res) => {
  try {
    let { userId, deviceToken } = req.body;

    if (!deviceToken || !userId) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }
    await User.update(
      {
        fcmToken: deviceToken,
      },
      {
        where: {
          id: userId,
        },
      }
    );
    res.status(200).json({
      status: "SUCCESS",
      message: "User device token successfully updated",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error ", error });
  }
};
exports.updateDetails = async (req, res) => {
  try {
    let userId = req.user.id;
    const { firstName, lastName, email, removeProfileImage } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    if(profileImage){
      console.log("Here is the updated image when it enters the controller: ",profileImage)
    }

    if (!firstName || !lastName || !email || !userId) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }

    const existingUser = await User.findOne({ where: { id: userId } });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }

    if (profileImage && existingUser.profileImage) {
      const profileImagePath = path.join("public", "profile-images", existingUser.profileImage);
      if (fs.existsSync(profileImagePath)) {
        fs.unlinkSync(profileImagePath);
      }
    }

    const updateFields = { firstName, lastName, email };
    if(profileImage){
      console.log("Here we are saving the image into the database: ",profileImage)
    }
    if (profileImage) updateFields.profileImage = profileImage;

    if(removeProfileImage){
      if (existingUser.profileImage) {
        const profileImagePath = path.join(
          "public",
          "profile-images",
          existingUser.profileImage
        );
        if (fs.existsSync(profileImagePath)) {
          fs.unlinkSync(profileImagePath);
        }
      }
      await User.update(
        {profileImage: null},
        {
          where:{
            id:userId
          }
        }
      )
    }

    await User.update(updateFields, { where: { id: userId } });

    const updatedUser = await User.findOne({ where: { id: userId } });
    const currentUser = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage,
      role: updatedUser.role,
    };

    const token = createMobileToken(currentUser.id, currentUser.role);

    return res.status(200).json({
      status: "SUCCESS",
      message: "User details successfully updated",
      token,
      currentUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error",
      error,
    });
  }
};
exports.updateProfileImage = async (req, res) => {
  try {
    let userId = req.user.id;
    const profileImage = req.file ? req.file.filename : null;

    if (!profileImage || !userId) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }

    if (existingUser.profileImage) {
      const profileImagePath = path.join(
        "public",
        "profile-images",
        existingUser.profileImage
      );
      if (fs.existsSync(profileImagePath)) {
        fs.unlinkSync(profileImagePath);
      }
    }
    await User.update(
      { profileImage },
      {
        where: {
          id: userId,
        },
      }
    );
    const updateData = await User.findOne({
      where: {
        id: userId,
      },
    });
    const currentUser = {
      id: updateData.id,
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      email: updateData.email,
      profileImage: updateData.profileImage,
      role: updateData.role,
    };

    const token = createMobileToken(currentUser.id, currentUser.role);
    return res.status(200).json({
      status: "SUCCESS",
      message: "User profile image successfully updated",
      token,
      currentUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error ", error });
  }
};
exports.changePassword = async (req, res) => {
  try {
    let { currentPassword, newPassword, confirmPassword } = req.body;
    let userId = req.user.id;

    if (!currentPassword || !newPassword || !confirmPassword || !userId) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Input fields empty" });
    }
    const existingUser = await User.findOne({
      where: {
        id: userId,
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
        message: "Current password and the password provided do not match.",
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
    await User.update(
      { password: newPasswordHashed },
      {
        where: {
          id: userId,
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
      .json({ status: "FAILURE", message: "Internal Server Error ", error });
  }
};

exports.logout = async (req, res) => {
  try {
    res.status(200).json({ status: "SUCCESS", message: "User logged out" });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.validateDeviceToken = async (req, res) => {
  try {
    let { deviceToken } = req.body;

    if (!deviceToken) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Device token is null or empty" });
    }
    const existingDevice = await DeviceToken.findOne({
      where: {
        deviceToken,
      },
    });
    if (existingDevice.enabled) {
      res.status(200).json({
        status: "SUCCESS",
        allowNotification: true,
        message: "User has allowed to be able to recieve push notification",
      });
    } else {
      res.status(400).json({
        status: "FAILURE",
        allowNotification: false,
        message: "User has not enabled push notification",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.validateDeviceTokenLoggedIn = async (req, res) => {
  try {
    const { id } = req.user;
    const {deviceToken, role} = req.body

    if (!id || !deviceToken || !role) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Empty input fields" });
    }

    const existingUser = await User.findOne({
      where: { id },
    });
    
    if(!existingUser){
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }

    const existingDeviceToken = await FcmToken.findOne({
      where:{
        userId: id,
        deviceToken,
        role
      }
    });

    if (
     existingDeviceToken
    ) {
      return res.status(200).json({
        status: "SUCCESS",
        allowNotification: true,
        message: "User has allowed receiving push notifications",
      });
    } else {
      return res.status(400).json({
        status: "FAILURE",
        allowNotification: false,
        message: "User has not enabled push notifications",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};

exports.delete = async (req, res) => {
  try {
    let userId = req.user.id;

    if (!userId) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "User ID is required" });
    }
    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }
    const profileImagePath = path.join(
      __dirname,
      "../../public/users",
      existingUser.profileImage
    );
    if (fs.existsSync(profileImagePath)) {
      fs.unlinkSync(profileImagePath);
    }
    await User.destroy({
      where: {
        id: userId,
      },
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "User successfully deleted!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.removeDeviceToken = async (req, res) => {
  try {
    let { deviceToken, status } = req.body;

    if (!deviceToken) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "Device token is null or empty" });
    }
    const existingDevice = await DeviceToken.findOne({
      where: {
        deviceToken,
      },
    });
    if (!existingDevice) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "Device token not found!" });
    }

    await DeviceToken.update(
      {
        enabled: status
      },
      {
      where: {
        deviceToken,
      },
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "Device token successfully deleted!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
exports.removeLoggedInDeviceToken = async (req, res) => {
  try {
    let { id } = req.user;
    const {deviceToken, role} = req.body;

    if (!id || !deviceToken || !role) {
      return res
        .status(400)
        .json({ status: "FAILURE", message: "ID is null or empty" });
    }
    const existingUser = await User.findOne({
      where: {
        id,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "User not found!" });
    }
    const existingDevice = await FcmToken.findOne({
      where: {
        userId:id,
        deviceToken,
        role
      },
    });
    if (!existingDevice) {
      return res
        .status(404)
        .json({ status: "FAILURE", message: "Device token not found!" });
    }
    await FcmToken.destroy(
      {
      where:{
        userId:id,
        deviceToken,
        role
      }
    });
    res.status(200).json({
      status: "SUCCESS",
      message: "Device token successfully remove!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "FAILURE", message: "Internal Server Error" });
  }
};
