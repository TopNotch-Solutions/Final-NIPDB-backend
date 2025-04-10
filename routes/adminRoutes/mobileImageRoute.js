const {Router} = require('express');
const mobileImageController = require('../../controllers/admin/mobileImageController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const mobileImagesUploadMiddleware = require('../../middlewares/shared/mobileImagesUploadMiddleware');
const mobileImageAdminRouter = Router();

mobileImageAdminRouter.post('/create', mobileImagesUploadMiddleware.uploadSingle, mobileImageController.create); 

mobileImageAdminRouter.get('/all',tokenAuthMiddleware, checkAdmin, mobileImageController.all);
mobileImageAdminRouter.get('/single/:id', tokenAuthMiddleware, checkAdmin, mobileImageController.single);

mobileImageAdminRouter.put('/update/:id', mobileImagesUploadMiddleware.uploadSingle, mobileImageController.update);
mobileImageAdminRouter.delete('/delete/:id',tokenAuthMiddleware, checkAdmin, mobileImageController.delete);


module.exports = mobileImageAdminRouter;