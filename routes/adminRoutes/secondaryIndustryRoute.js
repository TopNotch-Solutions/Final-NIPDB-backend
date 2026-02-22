const {Router} = require('express');
const secondaryIndustryAdminController = require('../../controllers/admin/secondaryIndustryController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const secondaryIndustryAdminRouter = Router();

secondaryIndustryAdminRouter.post('/create',secondaryIndustryAdminController.create);

secondaryIndustryAdminRouter.get('/all',tokenAuthMiddleware, checkAdmin,secondaryIndustryAdminController.all);
secondaryIndustryAdminRouter.get('/single/:id',tokenAuthMiddleware, checkAdmin, secondaryIndustryAdminController.single);

secondaryIndustryAdminRouter.put('/update/:id',tokenAuthMiddleware, checkAdmin, secondaryIndustryAdminController.update);

secondaryIndustryAdminRouter.delete('/delete/:id',tokenAuthMiddleware, checkAdmin,  secondaryIndustryAdminController.delete);

module.exports = secondaryIndustryAdminRouter;