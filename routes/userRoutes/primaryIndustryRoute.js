const {Router} = require('express');
const primaryIndustryUserController = require('../../controllers/user/primaryIndustryController');
const primaryIndustryUserRouter = Router();
const {tokenAuthMiddleware, appTokenMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkUser, checkAppUser} = require("../../middlewares/mobile/authMiddleware");


primaryIndustryUserRouter.get('/all/details', appTokenMiddleware,checkAppUser, primaryIndustryUserController.all);
primaryIndustryUserRouter.get('/all/industryName', appTokenMiddleware,checkAppUser,  primaryIndustryUserController.allIndustryName);
primaryIndustryUserRouter.get('/all/withoutIcon',appTokenMiddleware, checkAppUser, primaryIndustryUserController.allWithoutIcon);
primaryIndustryUserRouter.get('/single/:id',tokenAuthMiddleware, checkUser, primaryIndustryUserController.single);


module.exports = primaryIndustryUserRouter;