const {Router} = require('express');
const pushNotificationController = require('../../controllers/user/pushNotificationController');
const pushNotificationUserRouter = Router();
const {appTokenMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkAppUser} = require("../../middlewares/mobile/authMiddleware");

pushNotificationUserRouter.get('/push-notifications/all/:deviceToken', appTokenMiddleware, checkAppUser, pushNotificationController.allUserNotification);
pushNotificationUserRouter.get('/push-notifications/unread/:deviceToken', appTokenMiddleware, checkAppUser, pushNotificationController.unreadNotification);
pushNotificationUserRouter.get('/push-notifications/read/:deviceToken', appTokenMiddleware, checkAppUser, pushNotificationController.readNotification);
pushNotificationUserRouter.get('/totalNotificationCount/:deviceToken', appTokenMiddleware, checkAppUser, pushNotificationController.totalNotficationCount);

pushNotificationUserRouter.put('/update/:deviceToken', appTokenMiddleware, checkAppUser, pushNotificationController.updateViewed); 

pushNotificationUserRouter.delete('/delete/:deviceToken', appTokenMiddleware, checkAppUser, pushNotificationController.deleteSingle);

module.exports = pushNotificationUserRouter;