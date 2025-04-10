const {Router} = require('express');
const primaryIndustryAdminController = require('../../controllers/admin/primaryIndustryController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const primaryIndustryUploadMiddleware = require('../../middlewares/shared/primaryIndustryUploadMiddleware');
const primaryIndustryAdminRouter = Router();

primaryIndustryAdminRouter.post('/create',tokenAuthMiddleware, checkAdmin, primaryIndustryUploadMiddleware.uploadSingle, primaryIndustryAdminController.create);

primaryIndustryAdminRouter.get('/all',tokenAuthMiddleware, checkAdmin, primaryIndustryAdminController.all);
primaryIndustryAdminRouter.get('/single/:id',tokenAuthMiddleware, checkAdmin, primaryIndustryAdminController.single);

primaryIndustryAdminRouter.put('/update/:id',tokenAuthMiddleware, checkAdmin,  primaryIndustryAdminController.update);
primaryIndustryAdminRouter.put('/updateLogo/:id',tokenAuthMiddleware, checkAdmin, primaryIndustryAdminController.updateLogo)

primaryIndustryAdminRouter.delete('/delete/:id',tokenAuthMiddleware, checkAdmin, primaryIndustryAdminController.delete);

module.exports = primaryIndustryAdminRouter;