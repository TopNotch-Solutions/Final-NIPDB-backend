const {Router} = require('express');
const mobileImageController = require('../../controllers/user/mobileImageController');
const mobileImageUserRouter = Router();
const { appTokenMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkAppUser} = require("../../middlewares/mobile/authMiddleware");

mobileImageUserRouter.get('/all', appTokenMiddleware, checkAppUser, mobileImageController.all);
mobileImageUserRouter.get('/single/:id', appTokenMiddleware, checkAppUser, mobileImageController.single);


module.exports = mobileImageUserRouter;