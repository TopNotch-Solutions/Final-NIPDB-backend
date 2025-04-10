const {Router} = require('express');
const bsoController = require('../../controllers/admin/bsoController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const bsosUploadMiddleware = require('../../middlewares/shared/bsosUploadMiddleware');
const bsoAdminRouter = Router();

bsoAdminRouter.post('/create',  bsosUploadMiddleware.uploadSingle, bsoController.create);

bsoAdminRouter.get('/all',tokenAuthMiddleware, checkAdmin, bsoController.all);
bsoAdminRouter.get('/all/download', tokenAuthMiddleware, checkAdmin, bsoController.allDownload);
bsoAdminRouter.get('/single/:id',tokenAuthMiddleware, checkAdmin, bsoController.single);
bsoAdminRouter.get('/count', tokenAuthMiddleware, checkAdmin, bsoController.totalBsos);

bsoAdminRouter.put('/update/:id', bsosUploadMiddleware.uploadSingle, bsoController.update);

bsoAdminRouter.delete('/delete/:id',tokenAuthMiddleware, checkAdmin, bsoController.delete);

module.exports = bsoAdminRouter;