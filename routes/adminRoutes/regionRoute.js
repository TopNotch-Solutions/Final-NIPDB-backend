const {Router} = require('express');
const regionController = require('../../controllers/admin/regionController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const regionAdminRouter = Router();

regionAdminRouter.post('/create',tokenAuthMiddleware, checkAdmin, regionController.create);
regionAdminRouter.get('/all',tokenAuthMiddleware, checkAdmin, regionController.all);
regionAdminRouter.get('/single/:id',tokenAuthMiddleware, checkAdmin, regionController.single);

module.exports = regionAdminRouter;