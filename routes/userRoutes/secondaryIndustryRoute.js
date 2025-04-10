const {Router} = require('express');
const secondaryIndustryUserController = require('../../controllers/user/secondaryIndustryController');
const secondaryIndustryUserRouter = Router();
const {appTokenMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkAppUser} = require("../../middlewares/mobile/authMiddleware");


secondaryIndustryUserRouter.get('/all', appTokenMiddleware,checkAppUser, secondaryIndustryUserController.all);
secondaryIndustryUserRouter.get('/single/:id', appTokenMiddleware,checkAppUser, secondaryIndustryUserController.single);


module.exports = secondaryIndustryUserRouter;