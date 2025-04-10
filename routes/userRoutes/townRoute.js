const {Router} = require('express');
const townController = require('../../controllers/user/townController');
const townUserRouter = Router();
const {appTokenMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkAppUser} = require("../../middlewares/mobile/authMiddleware");

townUserRouter.get('/all', appTokenMiddleware, checkAppUser, townController.all);
townUserRouter.get('/single/:id', appTokenMiddleware, checkAppUser, townController.single);
townUserRouter.get('/all/:regionId',appTokenMiddleware, checkAppUser, townController.getTownsByRegion);


module.exports = townUserRouter;