const {Router} = require('express');
const notificationController = require('../../controllers/admin/notificationController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const notificationAdminRouter = Router();

notificationAdminRouter.post('/create',tokenAuthMiddleware, checkAdmin, notificationController.createAll);

notificationAdminRouter.post('/create/single/:id',tokenAuthMiddleware, checkAdmin, notificationController.createSingle);

notificationAdminRouter.get('/all/notification-history',tokenAuthMiddleware, checkAdmin, notificationController.allAdminNotfication); // Notification history table
notificationAdminRouter.get('/all/sent-by-admin',tokenAuthMiddleware, checkAdmin, notificationController.allSentByAdmin);
notificationAdminRouter.get('/single/sent-by-admin/:notificationId',tokenAuthMiddleware, checkAdmin, notificationController.singleSentByAdmin);
notificationAdminRouter.get('/all/unread-notification',tokenAuthMiddleware, checkAdmin, notificationController.allUnRead);
notificationAdminRouter.get('/all/read-notification',tokenAuthMiddleware, checkAdmin, notificationController.allRead);
notificationAdminRouter.get('/single/notifications',tokenAuthMiddleware, checkAdmin, notificationController.singleAdminNotfication);
notificationAdminRouter.get('/single/:id',tokenAuthMiddleware, checkAdmin, notificationController.single);
notificationAdminRouter.get('/totalNotificationCount',tokenAuthMiddleware, checkAdmin, notificationController.totalCount);

notificationAdminRouter.put('/update/:id',tokenAuthMiddleware, checkAdmin, notificationController.updateViewed);
notificationAdminRouter.delete('/delete/:id',tokenAuthMiddleware, checkAdmin, notificationController.deleteSingle);

// notificationAdminRouter.put('/updatebulk/:senderId/:id', notificationController.updatebulk);
// notificationAdminRouter.put('/update/:senderId/:userId/:id', notificationController.updateSingle);

// notificationAdminRouter.delete('/updatebulk/:senderId/:id', notificationController.deletebulk);
// notificationAdminRouter.delete('/update/:senderId/:userId/:id', notificationController.deleteSingle);

module.exports = notificationAdminRouter;