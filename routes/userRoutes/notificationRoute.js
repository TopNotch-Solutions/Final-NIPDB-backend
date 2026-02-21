const {Router} = require('express');
const notificationController = require('../../controllers/user/notificationController');
const notificationUserRouter = Router();
const {tokenAuthMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkUser} = require("../../middlewares/mobile/authMiddleware");

notificationUserRouter.get('/notifications/all', tokenAuthMiddleware, checkUser, notificationController.allUserNotfication);
notificationUserRouter.get('/notifications/unread', tokenAuthMiddleware, checkUser, notificationController.unreadNotification);
notificationUserRouter.get('/notifications/read', tokenAuthMiddleware, checkUser, notificationController.readNotification);
notificationUserRouter.get('/totalNotificationCount', tokenAuthMiddleware, checkUser, notificationController.totalNotificationCount);

notificationUserRouter.put('/update/:notificationId',tokenAuthMiddleware, checkUser, notificationController.updateViewed); 

notificationUserRouter.delete('/delete/:notificationId', tokenAuthMiddleware, checkUser, notificationController.deleteSingle);

module.exports = notificationUserRouter;