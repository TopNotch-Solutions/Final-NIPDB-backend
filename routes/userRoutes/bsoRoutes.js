const {Router} = require('express');
const bsoController = require('../../controllers/user/bsoController');
const bsoUserRouter = Router();
const {tokenAuthMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkUser} = require("../../middlewares/mobile/authMiddleware");

bsoUserRouter.get('/all', tokenAuthMiddleware, checkUser, bsoController.all);
bsoUserRouter.get('/single/:id', tokenAuthMiddleware, checkUser, bsoController.single);


module.exports = bsoUserRouter;