const {Router} = require('express');
const regionController = require('../../controllers/user/regionController');
const regionUserRouter = Router();
const {appTokenMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkAppUser} = require("../../middlewares/mobile/authMiddleware");;

regionUserRouter.get('/all', appTokenMiddleware, checkAppUser, regionController.all);
regionUserRouter.get('/single/:id',appTokenMiddleware, checkAppUser, regionController.single);

module.exports = regionUserRouter;