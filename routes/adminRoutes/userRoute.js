const {Router} = require('express');
const userAdminController = require('../../controllers/admin/userController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const userAdminRouter = Router();

userAdminRouter.get('/all/admin/list',tokenAuthMiddleware, checkAdmin, userAdminController.allAdminList);
userAdminRouter.get('/all/admin/list/download',tokenAuthMiddleware, checkAdmin, userAdminController.allAdminListDownload)
userAdminRouter.get('/all/system-users',tokenAuthMiddleware, checkAdmin, userAdminController.allSystemUser);
userAdminRouter.get('/all/super-admin-count',tokenAuthMiddleware, checkAdmin,userAdminController.superAdmincount);
userAdminRouter.get('/all/admin-count', tokenAuthMiddleware, checkAdmin,userAdminController.allAdmincount);
userAdminRouter.get('/all/app-user-count',tokenAuthMiddleware, checkAdmin, userAdminController.appUserCount);


userAdminRouter.put('/update',tokenAuthMiddleware, checkAdmin, userAdminController.update);
userAdminRouter.delete('/delete',tokenAuthMiddleware, checkAdmin, userAdminController.delete);

userAdminRouter.patch('/update/role',tokenAuthMiddleware, checkAdmin, userAdminController.role); // provide status Approved, Rejected


module.exports = userAdminRouter;