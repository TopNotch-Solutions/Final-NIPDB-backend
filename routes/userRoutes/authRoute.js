const {Router} = require('express');
const authController = require('../../controllers/user/authController');
const authUserRouter = Router();
const {tokenAuthMiddleware, appTokenMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkUser,checkAppUser} = require("../../middlewares/mobile/authMiddleware");;
const updateUserProfileImage = require('../../middlewares/shared/updateUserProfileImage');
const profileUploadMiddleware = require('../../middlewares/shared/profileUploadMiddleware');

authUserRouter.post('/signup', profileUploadMiddleware.uploadSingle, authController.signup);  
authUserRouter.post('/verifyOTP', authController.verifyOTP);
authUserRouter.post('/forget-password/verifyOTP', authController.verifyForgotOTP);
authUserRouter.post('/resendOTP', authController.resendOTP);
authUserRouter.post('/sendOTP',authController.sendOTP);
authUserRouter.post('/login', authController.login);
authUserRouter.post('/forgot-password/email',appTokenMiddleware, checkAppUser, authController.forgotPasswordEmail);
authUserRouter.post('/forgot-password/resendOTP',appTokenMiddleware, checkAppUser, authController.forgotPasswordResendOTP);
authUserRouter.post('/app-user/register-device-token',appTokenMiddleware, checkAppUser, authController.register);
authUserRouter.post('/register-device-token', tokenAuthMiddleware, checkUser, authController.registerDeviceToken);  

authUserRouter.get('/logout',appTokenMiddleware, checkAppUser, checkAppUser, authController.logout);
authUserRouter.get('/app-user/is-push-notification-enabled', appTokenMiddleware, checkAppUser, authController.validateDeviceToken); //.. to check whether the user allowed push notification or not if not loggedin
authUserRouter.get('/is-push-notification-enabled',tokenAuthMiddleware, checkUser, authController.validateDeviceTokenLoggedIn); // to check whether the user allowed push notification or not if not loggedin
authUserRouter.get('/validate-user/:email',appTokenMiddleware, checkAppUser, authController.validateUser); //to validate if the user is returning or new user
authUserRouter.get('/validate-update', tokenAuthMiddleware, checkUser, authController.validateUpdate); // to validate if the user's credentials are all up to date
authUserRouter.get('/user-details', tokenAuthMiddleware, checkUser, authController.userDetails); // Get user individual details
authUserRouter.get('/migrate', authController.migrate); 
authUserRouter.get('/test/push', authController.test); 
authUserRouter.get('/data-token', authController.dataToken); 

//authUserRouter.put('/fcm-token', authController.fcmToken) // This endpoint is no more need because the tokens are being stored in other table
authUserRouter.put('/update-details', tokenAuthMiddleware, checkUser, profileUploadMiddleware.uploadSingle, authController.updateDetails);
authUserRouter.put('/update-profile-image', tokenAuthMiddleware, checkUser, profileUploadMiddleware.uploadSingle, authController.updateProfileImage)
authUserRouter.put('/change-password', tokenAuthMiddleware, checkUser, authController.changePassword);
authUserRouter.put('/forgot-password/new-password', appTokenMiddleware, checkAppUser, authController.forgotPasswordNewPassword);



authUserRouter.delete('/delete', tokenAuthMiddleware, checkUser, authController.delete);
authUserRouter.put('/app-user/remove-device-token',appTokenMiddleware, checkAppUser, authController.removeDeviceToken); // remove or delete device token
authUserRouter.delete('/logged-in/remove-device-token', tokenAuthMiddleware, checkUser, authController.removeLoggedInDeviceToken); // remove or delete device token

module.exports = authUserRouter;