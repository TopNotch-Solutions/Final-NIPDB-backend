const {Router} = require('express');
const msmeAdminController = require('../../controllers/admin/msmeController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const msmeUploadMiddleware = require('../../middlewares/shared/msmeUploadMiddleware');
const msmeAdminRouter = Router();
msmeAdminRouter.post('/create', msmeUploadMiddleware.uploadMultiple, msmeAdminController.create);
msmeAdminRouter.get('/all/user',tokenAuthMiddleware, checkAdmin, msmeAdminController.allUser)
msmeAdminRouter.get('/all',tokenAuthMiddleware, checkAdmin, msmeAdminController.all);
msmeAdminRouter.get('/all/approved',tokenAuthMiddleware, checkAdmin, msmeAdminController.allApproved);
msmeAdminRouter.get('/all/pending',tokenAuthMiddleware, checkAdmin, msmeAdminController.allPending);
msmeAdminRouter.get('/all/rejected',tokenAuthMiddleware, checkAdmin, msmeAdminController.allRejected);
msmeAdminRouter.get('/all/incomplete',tokenAuthMiddleware, checkAdmin, msmeAdminController.allIncomplete);
msmeAdminRouter.get('/all/blocked',tokenAuthMiddleware, checkAdmin, msmeAdminController.allBlocked);
msmeAdminRouter.get('/single/:id',tokenAuthMiddleware, checkAdmin, msmeAdminController.single);
msmeAdminRouter.get('/single-msme/:id',tokenAuthMiddleware, checkAdmin, msmeAdminController.singleMsme);
msmeAdminRouter.get('/totalCount',tokenAuthMiddleware, checkAdmin,  msmeAdminController.totalCount);
msmeAdminRouter.get('/pendingCount',tokenAuthMiddleware, checkAdmin, msmeAdminController.pendingCount);
msmeAdminRouter.get('/rejectedCount',tokenAuthMiddleware, checkAdmin, msmeAdminController.rejectedCount);
msmeAdminRouter.get('/incompleteCount',tokenAuthMiddleware, checkAdmin, msmeAdminController.incompleteCount);
msmeAdminRouter.get('/approvedCount',tokenAuthMiddleware, checkAdmin, msmeAdminController.approvedCount);
msmeAdminRouter.get('/top5/categories',tokenAuthMiddleware, checkAdmin,  msmeAdminController.topCategory);
msmeAdminRouter.get('/monthly/registeration',tokenAuthMiddleware, checkAdmin, msmeAdminController.montlyRegistration)

msmeAdminRouter.put('/update/:businessId', msmeUploadMiddleware.uploadMultiple, msmeAdminController.update);
msmeAdminRouter.put('/status/:id',tokenAuthMiddleware, checkAdmin, msmeAdminController.status); // provide status Approved, Rejected
msmeAdminRouter.put('/block/:id',tokenAuthMiddleware, checkAdmin, msmeAdminController.block); //provide true or false

module.exports = msmeAdminRouter;