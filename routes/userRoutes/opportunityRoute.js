const {Router} = require('express');
const opportunityController = require('../../controllers/user/opportunityController');
const {tokenAuthMiddleware, appTokenMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkUser, checkAppUser} = require("../../middlewares/mobile/authMiddleware");
const opportunityUserRouter = Router();


opportunityUserRouter.get('/all/general-users', appTokenMiddleware, checkAppUser, opportunityController.allGeneral);
opportunityUserRouter.get('/single/general-users/:id', appTokenMiddleware, checkAppUser, opportunityController.singleGeneral);
opportunityUserRouter.get('/all/business-users',tokenAuthMiddleware, checkUser, opportunityController.allBusiness);
opportunityUserRouter.get('/single/business-users/:id',tokenAuthMiddleware, checkUser, opportunityController.singleBusiness);

module.exports = opportunityUserRouter;