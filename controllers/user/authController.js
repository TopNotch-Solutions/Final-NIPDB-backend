const User = require("../../models/user");
const { createMobileToken, createAppUserToken } = require("../../utils/mobile/generateToken");
const CapitalizeFirstLetter = require("../../utils/shared/capitalizeFirstLetter");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const adminFirebase = require("../../config/firebaseConfig")
const OTP = require("../../models/otpVerification");
const sendOTPVerification = require("../../utils/mobile/sendOtp");
const { where, Op, } = require("sequelize");
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
const sequelize = require("../../config/dbConfig");
const { newPassword } = require("../admin/authController");

exports.signup = async (req, res) => {
  let { firstName, lastName, email, password } = req.body;
  let profileImage = req.file ? req.file.filename : null;
  const role = "User";

   if (!firstName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "First Name required fields",
      });
    }

    if (!lastName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Last Name required fields",
      });
    }
    if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Email required fields",
      });
    }
    if (!password) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Password required fields",
      });
    }


  firstName = CapitalizeFirstLetter(firstName);
  lastName = CapitalizeFirstLetter(lastName);
  const t = await sequelize.transaction();

  try {
  const existingUser = await User.findOne({ where: { email }, transaction: t });

  if (existingUser) {
    if (!existingUser.verified) {
      const subject = "In4MSME OTP Verification";

      await sendOTPVerification(
        { id: existingUser.id, email: existingUser.email, role: existingUser.role || "User" },
        res,
        { subject }
      );
      await t.commit();
      return;
    }

    await t.rollback();
    return res.status(409).json({
      success: false,
      statusCode: 409,
       message: "The provided email is already registered and verified.",
      userId: existingUser.id

    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    profileImage,
    role: role || "User",
    isMigratedUser: false,
  },{transaction: t});

  if (!newUser) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Unable to create new user at this time."
    });
  }

  const subject = "In4MSME OTP Verification";
  await sendOTPVerification(
    { id: newUser.id, email: newUser.email, role: "User" },
    res,
    { subject }
  );
 await t.commit();
} catch (error) {
  await t.rollback();
  console.error("User Registration Error:", {
    message: error.message,
    stack: error.stack
  });

  return res.status(503).json({
    success: false,
    statusCode: 503,
    message: "Service temporarily unavailable. Please try again later."
  });
}
};

exports.verifyOTP = async (req, res) => {
  const { otp, userId, role } = req.body;
  if (!otp) {
      return res.status(400).json({
        status: "FAILURE",
        message: "OTP required fields",
      });
    }

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
    if (!role) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Role required fields",
      });
    }
  const t = await sequelize.transaction();

  try {
    const verifyUser = await OTP.findOne({
      where: { userId, role },
      transaction: t,
    });

    if (!verifyUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message:
          "Account record doesn't exist or has been verified already. Please sign up or login.",
      });
    }

    const { expiresAt, otp: hashedOTP } = verifyUser;

    if (new Date(expiresAt).getTime() < Date.now()) {
      await OTP.destroy({ where: { userId, role }, transaction: t });
      await t.commit();

      return res.status(400).json({
        status: "FAILURE",
        message:
          role === "User"
            ? "OTP has expired. Please request a new one."
            : "Reset link has expired. Please request a new link.",
      });
    }

    const validOTP = await bcrypt.compare(otp, hashedOTP);
    if (!validOTP) {
      await t.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Invalid code passed. Check your inbox.",
      });
    }
    if (role === "User") {
      await User.update({ verified: true }, { where: { id: userId }, transaction: t });
    }

    await OTP.destroy({ where: { userId, role }, transaction: t });

    await t.commit();

    return res.status(200).json({
      status: "VERIFIED",
      message: role === "User" ? "User verified successfully." : "Link is valid.",
    });
  } catch (error) {
    await t.rollback();
    console.error("OTP Verification Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.verifyForgotOTP = async (req, res) => {
  const { otp, userId } = req.body;
  if (!otp) {
      return res.status(400).json({
        status: "FAILURE",
        message: "OTP required fields",
      });
    }

    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
  const t = await sequelize.transaction();

  try {
    const verifyUser = await OTP.findOne({ where: { userId }, transaction: t });

    if (!verifyUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message:
          "Account record doesn't exist or has been verified already. Please sign up or login.",
      });
    }

    const { expiresAt, otp: hashedOTP } = verifyUser;

    if (new Date(expiresAt).getTime() < Date.now()) {
      await OTP.destroy({ where: { userId }, transaction: t });
      await t.commit();
      return res.status(400).json({
        status: "FAILURE",
        message: "OTP has expired. Please request a new one.",
      });
    }

    // 🔹 Validate OTP
    const isValidOTP = await bcrypt.compare(otp, hashedOTP);
    if (!isValidOTP) {
      await t.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Invalid code passed. Check your inbox.",
      });
    }

    await OTP.destroy({ where: { userId }, transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "VERIFIED",
      message: "OTP verified successfully.",
    });

  } catch (error) {
    await t.rollback();
    console.error("Forgot OTP Verification Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
    });
  }
};

exports.resendOTP = async (req, res) => {
   const { email, userId } = req.body;
  if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User's email required fields",
      });
    }
    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User's ID required fields",
      });
    }
  const t = await sequelize.transaction(); // Start transaction

  try {
    await OTP.destroy({ where: { userId }, transaction: t });
    const subject = "In4MSME OTP Resend Verification";

    await sendOTPVerification(
      { id: userId, email, role: "User" },
      res,
      { subject },
      t
    );

    await t.commit();
    
  } catch (error) {
    await t.rollback();
    console.error("Resend OTP Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
    });
  }
};
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User's email required fields",
      });
    }
  const t = await sequelize.transaction(); // Start transaction

  try {
    const existingUser = await User.findOne({ where: { email }, transaction: t });

    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "No user found with the provided email.",
      });
    }
    await OTP.destroy({ where: { userId: existingUser.id }, transaction: t });

    const subject = "In4MSME OTP Verification";
    await sendOTPVerification(
      { id: existingUser.id, email, role: "User" },
      res,
      { subject }
    );

    await t.commit();

  } catch (error) {
    await t.rollback();
    console.error("Send OTP Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
    });
  }
};
exports.login = async (req, res) => {
  const { email, password, deviceToken, role } = req.body;
  if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Email required field",
      });
    }
    if (!password) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Password required field",
      });
    }
    if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device required field",
      });
    }
    if (!role) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Role required field",
      });
    }
  const t = await sequelize.transaction();

  try {
    const user = await User.findOne({ where: { email }, transaction: t });

    if (!user) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "This account doesn't exist. Enter a different account or sign up.",
      });
    }

    if (user.isMigratedUser) {
      await t.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message:
          "Password reset required. Please tap 'Forgot Password' to set up a new password.",
      });
    }

    if (!user.verified) {
      const subject = "In4MSME Account Verification";
      await sendOTPVerification(
        { id: user.id, email, role: "User" },
        res,
        { subject }
      );
      await t.commit();
      return; 
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await t.rollback();
      return res.status(401).json({
        status: "FAILURE",
        message: "Invalid credentials. Please try again.",
      });
    }

    if (user.role === "Admin" || user.role === "Super admin") {
      await t.rollback();
      return res.status(403).json({
        status: "FAILURE",
        message: "User does not have access to this route.",
      });
    }

    await FcmToken.upsert(
      {
        deviceToken,
        role,
        userId: user.id,
      },
      { transaction: t }
    );

    await t.commit();

    const currentUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
    };

    const token = createMobileToken(currentUser.id, currentUser.role);
    if (!token) {
      return res.status(500).json({
        status: "FAILURE",
        message: "Token generation failed. Please try again.",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Login successful.",
      token,
      currentUser,
    });

  } catch (error) {
    await t.rollback();
    console.error("Login Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
    });
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
  const { email } = req.body;
  if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User email required fields",
      });
    }
  const t = await sequelize.transaction();

  try {
    const existingUser = await User.findOne({ where: { email }, transaction: t });

    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found with the provided email.",
      });
    }

    const userId = existingUser.id;
    await OTP.destroy({ where: { userId }, transaction: t });

    const subject = "In4MSME Forgot Password Verification";
    await sendOTPVerification({ id: userId, email, role: "User" }, res, { subject });

    await t.commit();

  } catch (error) {
    await t.rollback();
    console.error("Forgot Password Email Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
    });
  }
};

exports.validateUser = async (req, res) => {
  const { email } = req.params;
  if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User's email required fields",
      });
    }
  const t = await sequelize.transaction();

  try {
   
    const existingUser = await User.findOne({
      where: { email, isMigratedUser: true },
      transaction: t,
    });

    await t.commit();

    if (existingUser) {
      return res.status(200).json({
        status: "SUCCESS",
        returningUser: true,
        message: "Returning user detected.",
      });
    } else {
      return res.status(200).json({
        status: "FAILURE",
        returningUser: false,
        message: "Not a returning user.",
      });
    }
  } catch (error) {
    await t.rollback(); // rollback if something fails
    console.error("Validate User Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

exports.validateUpdate = async (req, res) => {
  const id = req.user?.id;
  if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
  const t = await sequelize.transaction();

  try {
    const existingUser = await User.findOne({
      where: {
        id,
        [Op.or]: [
          { firstName: { [Op.or]: [null, ""] } },
          { lastName: { [Op.or]: [null, ""] } },
          { password: { [Op.or]: [null, ""] } },
        ],
      },
      transaction: t,
    });

    await t.commit();

    if (existingUser) {
      return res.status(200).json({
        status: "SUCCESS",
        updateDetails: true,
        message: "User needs to update their details.",
      });
    } else {
      return res.status(200).json({
        status: "SUCCESS",
        updateDetails: false,
        message: "User details are complete; no update required.",
      });
    }
  } catch (error) {
    await t.rollback();
    console.error("Validate Update Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      updateDetails: false,
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

exports.userDetails = async (req, res) => {
  const id = req.user?.id;
  if (!id) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
  const t = await sequelize.transaction();

  try {
   
    const existingUser = await User.findOne({
      where: { id },
      attributes: ["id", "firstName", "lastName", "email", "profileImage"],
      transaction: t,
    });

    await t.commit();

    if (existingUser) {
      return res.status(200).json({
        status: "SUCCESS",
        data: existingUser,
        message: "User details successfully retrieved.",
      });
    } else {
      return res.status(404).json({
        status: "FAILURE",
        data: null,
        message: "User not found.",
      });
    }
  } catch (error) {
    await t.rollback();
    console.error("User Details Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      data: null,
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
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
  let { newPassword, confirmPassword, userId } = req.body;
  if (!newPassword) {
      return res.status(400).json({
        status: "FAILURE",
        message: "New Password required fields",
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Confirm Password required fields",
      });
    }
    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
  const t = await sequelize.transaction(); 

  try {
    const existingUser = await User.findOne({
      where: { id: userId },
      transaction: t,
    });

    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found.",
        data: null,
      });
    }

    if (newPassword !== confirmPassword) {
      await t.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "New password and confirm password do not match.",
        data: null,
      });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);


    await User.update(
      { password: hashedPassword, isMigratedUser: false },
      { where: { id: userId }, transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Password updated successfully.",
    });
  } catch (error) {
    await t.rollback();
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
      error: error.message,
      data: null,
    });
  }
};

exports.forgotPasswordResendOTP = async (req, res) => {
   const { email } = req.body;
  if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User's email required fields",
      });
    }
  const t = await sequelize.transaction(); // Start a transaction

  try {
    const existingUser = await User.findOne({
      where: { email },
      transaction: t,
    });

    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found.",
      });
    }

    const userId = existingUser.id;

    await OTP.destroy({
      where: { userId },
      transaction: t,
    });

    const subject = "In4MSME Forgot Password Resend OTP Verification";
    await sendOTPVerification(
      { id: userId, email, role: "User" },
      res,
      { subject }
    );

    await t.commit();

  } catch (error) {
    await t.rollback();
    console.error("Forgot Password Resend OTP Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Service temporarily unavailable. Please try again later.",
      error: error.message,
    });
  }
};

exports.register = async (req, res) => {
  const { deviceToken } = req.body;
  if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device Token required fields",
      });
    }
  const t = await sequelize.transaction();

  try {
    const existingToken = await DeviceToken.findOne({
      where: { deviceToken },
      transaction: t,
    });

    if (existingToken) {
      await t.rollback();
      return res.status(409).json({
        status: "FAILURE",
        message: "Device token already in use.",
        data: { deviceTokenId: existingToken.id },
      });
    }

    const newToken = await DeviceToken.create(
      {
        deviceToken,
        enabled: true,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      status: "SUCCESS",
      message: "Device token successfully registered.",
      data: { deviceTokenId: newToken.id },
    });
  } catch (error) {
    await t.rollback();
    console.error("Device Token Registration Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Service temporarily unavailable. Please try again later.",
      error: error.message,
      data: null,
    });
  }
};

exports.registerDeviceToken = async (req, res) => {
  const userId = req.user?.id;
    const { deviceToken, role } = req.body;
   if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device Token required fields",
      });
    }
    if (!role) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Role required fields",
      });
    }
  const t = await sequelize.transaction();
  try {

    const existingToken = await FcmToken.findOne({
      where: { deviceToken, role },
      transaction: t,
    });

    if (existingToken) {
      await FcmToken.destroy({
        where: { deviceToken, role },
        transaction: t,
      });
    }

    const newToken = await FcmToken.create(
      {
        userId,
        deviceToken,
        role,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      status: "SUCCESS",
      message: "Device token successfully registered.",
      data: { fcmTokenId: newToken.id },
    });
  } catch (error) {
    await t.rollback();
    console.error("FCM Device Token Registration Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Service temporarily unavailable. Please try again later.",
      error: error.message
    });
  }
};

exports.fcmToken = async (req, res) => {
   const { userId, deviceToken } = req.body;
  if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device Token required fields",
      });
    }
    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
  const t = await sequelize.transaction(); // Start transaction
  try {
   
    const existingUser = await User.findOne({
      where: { id: userId },
      transaction: t,
    });

    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found.",
        data: null,
      });
    }

    await User.update(
      { fcmToken: deviceToken },
      { where: { id: userId }, transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "User device token successfully updated.",
      data: { userId },
    });
  } catch (error) {
    await t.rollback();
    console.error("FCM Token Update Error:", error);

    return res.status(500).json({
      status: "FAILURE",
      message: "Service temporarily unavailable. Please try again later.",
      error: error.message,
      data: null,
    });
  }
};

exports.updateDetails = async (req, res) => {
   const userId = req.user.id;
    const { firstName, lastName, email, removeProfileImage } = req.body;
    const profileImage = req.file ? req.file.filename : null;
   if (!firstName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "First Name required fields",
      });
    }

    if (!lastName) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Last Name required fields",
      });
    }
    if (!email) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Email required fields",
      });
    }
  const t = await sequelize.transaction(); // Start transaction
  try {
  
    const existingUser = await User.findOne({ where: { id: userId }, transaction: t });
    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found.",
      });
    }

    if (profileImage && existingUser.profileImage) {
      const oldImagePath = path.join("public", "profile-images", existingUser.profileImage);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    if (removeProfileImage && existingUser.profileImage) {
      const oldImagePath = path.join("public", "profile-images", existingUser.profileImage);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      profileImage = null;
    }

    const updateFields = { firstName, lastName, email };
    if (profileImage) updateFields.profileImage = profileImage;

    await User.update(updateFields, { where: { id: userId }, transaction: t });
    await t.commit();

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
    await t.rollback();
    console.error("Update User Details Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

exports.updateProfileImage = async (req, res) => {
  const userId = req.user.id;
    const profileImage = req.file ? req.file.filename : null;
  const t = await sequelize.transaction();
  if (!profileImage) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Profile image required fields",
      });
    }
  try {
    
    const existingUser = await User.findOne({ where: { id: userId }, transaction: t });
    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found!",
      });
    }

    if (existingUser.profileImage) {
      const oldImagePath = path.join("public", "profile-images", existingUser.profileImage);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    await User.update({ profileImage }, { where: { id: userId }, transaction: t });
    await t.commit();

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
      message: "User profile image successfully updated",
      token,
      currentUser,
    });
  } catch (error) {
    await t.rollback();
    console.error("Update Profile Image Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  let { currentPassword ,newPassword, confirmPassword} = req.body;
  const userId = req.user.id;
   if (!currentPassword) {
      return res.status(400).json({
        status: "FAILURE",
        message: "New Password required fields",
      });
    }
  if (!newPassword) {
      return res.status(400).json({
        status: "FAILURE",
        message: "New Password required fields",
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Confirm Password required fields",
      });
    }
    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
  const t = await sequelize.transaction();
  try {
  
    const existingUser = await User.findOne({ where: { id: userId }, transaction: t });
    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found!",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
    if (!isCurrentPasswordValid) {
      await t.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "Current password does not match our records.",
        data: null,
      });
    }

    if (newPassword !== confirmPassword) {
      await t.rollback();
      return res.status(400).json({
        status: "FAILURE",
        message: "New password and confirm password do not match.",
        data: null,
      });
    }

    const salt = await bcrypt.genSalt();
    const newPasswordHashed = await bcrypt.hash(newPassword, salt);

    await User.update(
      { password: newPasswordHashed },
      { where: { id: userId }, transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Password successfully updated",
    });
  } catch (error) {
    await t.rollback();
    console.error("Change Password Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
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
  const { deviceToken } = req.body;
  if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device token required fields",
      });
    }
  const t = await sequelize.transaction();
  try {
  
    const existingDevice = await DeviceToken.findOne({ where: { deviceToken }, transaction: t });

    if (!existingDevice) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        allowNotification: false,
        message: "Device token not found",
      });
    }

    if (existingDevice.enabled) {
      await t.commit();
      return res.status(200).json({
        status: "SUCCESS",
        allowNotification: true,
        message: "User is allowed to receive push notifications",
      });
    } else {
      await t.commit();
      return res.status(400).json({
        status: "FAILURE",
        allowNotification: false,
        message: "User has not enabled push notifications",
      });
    }
  } catch (error) {
    await t.rollback();
    console.error("Validate Device Token Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      allowNotification: false,
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

exports.validateDeviceTokenLoggedIn = async (req, res) => {
  const { id } = req.user;
    const { deviceToken, role } = req.body;
  if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device token required fields",
      });
    }

    if (!role) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Role required fields",
      });
    }
  const t = await sequelize.transaction();
  try {
  
    const existingUser = await User.findOne({ where: { id }, transaction: t });
    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        allowNotification: false,
        message: "User not found!",
      });
    }

    const existingDeviceToken = await FcmToken.findOne({
      where: { userId: id, deviceToken, role },
      transaction: t,
    });

    if (existingDeviceToken) {
      await t.commit();
      return res.status(200).json({
        status: "SUCCESS",
        allowNotification: true,
        message: "User has allowed receiving push notifications",
      });
    } else {
      await t.commit();
      return res.status(400).json({
        status: "FAILURE",
        allowNotification: false,
        message: "User has not enabled push notifications",
      });
    }
  } catch (error) {
    await t.rollback();
    console.error("Validate Device Token Logged In Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      allowNotification: false,
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

exports.delete = async (req, res) => {
   const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "User ID required fields",
      });
    }
  const t = await sequelize.transaction();
  try {
   
    const existingUser = await User.findOne({ where: { id: userId }, transaction: t });
    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found!",
      });
    }

    if (existingUser.profileImage) {
      const profileImagePath = path.join(
        __dirname,
        "../../public/users",
        existingUser.profileImage
      );
      if (fs.existsSync(profileImagePath)) {
        fs.unlinkSync(profileImagePath);
      }
    }

    await User.destroy({ where: { id: userId }, transaction: t });

    await t.commit();
    return res.status(200).json({
      status: "SUCCESS",
      message: "User successfully deleted!",
    });
  } catch (error) {
    await t.rollback();
    console.error("User Deletion Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

exports.removeDeviceToken = async (req, res) => {
     const { deviceToken, status } = req.body;
     if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device token required fields",
      });
    }
    if (!status) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Status required fields",
      });
    }
  const t = await sequelize.transaction();
  try {
 
    const existingDevice = await DeviceToken.findOne({
      where: { deviceToken },
      transaction: t,
    });
    if (!existingDevice) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Device token not found!",
      });
    }

    await DeviceToken.update(
      { enabled: status },
      { where: { deviceToken }, transaction: t }
    );

    await t.commit();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Device token successfully updated!",
    });
  } catch (error) {
    await t.rollback();
    console.error("Remove Device Token Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

exports.removeLoggedInDeviceToken = async (req, res) => {
  const userId = req.user.id;
    const { deviceToken, role } = req.body;
   if (!deviceToken) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Device token required fields",
      });
    }
    if (!role) {
      return res.status(400).json({
        status: "FAILURE",
        message: "Role required fields",
      });
    }
  const t = await sequelize.transaction();
  try {
    
    const existingUser = await User.findOne({
      where: { id: userId },
      transaction: t,
    });
    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found!",
      });
    }

    const existingDevice = await FcmToken.findOne({
      where: { userId, deviceToken, role },
      transaction: t,
    });
    if (!existingDevice) {
      await t.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Device token not found!",
      });
    }

    await FcmToken.destroy({
      where: { userId, deviceToken, role },
      transaction: t,
    });

    await t.commit();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Device token successfully removed!",
    });
  } catch (error) {
    await t.rollback();
    console.error("Remove Logged-In Device Token Error:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
