const {Router} = require('express');
const directMessageController = require('../../controllers/user/directMessageController');
const directMessageUserRouter = Router();
const {tokenAuthMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkUser} = require("../../middlewares/mobile/authMiddleware");

directMessageUserRouter.post('/create/message', tokenAuthMiddleware, checkUser, directMessageController.create);

directMessageUserRouter.get('/all/messages/general-user', tokenAuthMiddleware, checkUser,  directMessageController.generalUser);
directMessageUserRouter.get('/all/messages/business-user/:currentBusinessId',tokenAuthMiddleware, checkUser, directMessageController.businessUser);
directMessageUserRouter.post('/single/user/chat/user', tokenAuthMiddleware, checkUser, directMessageController.singleUser);
directMessageUserRouter.post('/single/user/chat/business', tokenAuthMiddleware, checkUser, directMessageController.singleChatBusiness);
directMessageUserRouter.get('/single/business/chat', tokenAuthMiddleware, checkUser, directMessageController.singleBusiness);
directMessageUserRouter.get('/checkMessageExist', tokenAuthMiddleware, checkUser, directMessageController.messageExist);

directMessageUserRouter.get('/incoming/messages/count/single-chat/:senderId',tokenAuthMiddleware, checkUser, directMessageController.count);
directMessageUserRouter.get('/incoming/messages/count/all-messages',tokenAuthMiddleware, checkUser, directMessageController.allCount);
directMessageUserRouter.get('/incoming/messages/count/all-business-messages/:businessId',tokenAuthMiddleware, checkUser, directMessageController.allBusinessCount);

directMessageUserRouter.put('/update',tokenAuthMiddleware, checkUser, directMessageController.update);
directMessageUserRouter.put('/update/status/:senderId',tokenAuthMiddleware, checkUser,  directMessageController.viewed);

directMessageUserRouter.delete('/delete/latest/message/:messageId',tokenAuthMiddleware, checkUser, directMessageController.delete);
directMessageUserRouter.put('/delete/sent-message/:messageId', tokenAuthMiddleware, checkUser, directMessageController.deleteSent);
directMessageUserRouter.put('/delete/received-message/:messageId',tokenAuthMiddleware, checkUser,directMessageController.deleteReceived);
directMessageUserRouter.put('/delete/conversation/:conversationId', tokenAuthMiddleware, checkUser, directMessageController.deleteConversation);


module.exports = directMessageUserRouter;