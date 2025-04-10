const {Router} = require('express');
const authController = require('../../controllers/admin/authController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const {refreshTokens} = require('../../middlewares/web/authMiddleware');
const authAdminRouter = Router();

authAdminRouter.post('/signup',tokenAuthMiddleware, checkAdmin, authController.signup);  
authAdminRouter.post('/login', authController.login);
authAdminRouter.post('/forgot-password', authController.forgotPassword);    //provide email
authAdminRouter.post('/update/email', tokenAuthMiddleware, checkAdmin,  authController.adminEmail);
authAdminRouter.post('/verify-otp', authController.verifyAdminOTP);

authAdminRouter.get('/logout', tokenAuthMiddleware, checkAdmin, authController.logout);
authAdminRouter.get('/currentUser', authController.currentUser);


authAdminRouter.put('/change-password',tokenAuthMiddleware, checkAdmin, authController.changePassword);
authAdminRouter.put('/newPassword',  authController.newPassword)
authAdminRouter.put('/update/details',tokenAuthMiddleware, checkAdmin, authController.details); 
authAdminRouter.put('/update/user/details/:id',tokenAuthMiddleware, checkAdmin, authController.detailsUser); 
authAdminRouter.put('/update/profile-image/:id',tokenAuthMiddleware, checkAdmin, authController.profileImage); 

authAdminRouter.delete('/delete',tokenAuthMiddleware, checkAdmin,authController.delete); 

module.exports = authAdminRouter;