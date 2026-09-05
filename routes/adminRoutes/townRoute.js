const {Router} = require('express');
const townController = require('../../controllers/admin/townController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const townAdminRouter = Router();

townAdminRouter.post('/create', tokenAuthMiddleware, checkAdmin, townController.create);
townAdminRouter.get('/all', tokenAuthMiddleware, checkAdmin, townController.all);
townAdminRouter.get('/single/:id', tokenAuthMiddleware, checkAdmin, townController.single);
townAdminRouter.put('/update/:id', tokenAuthMiddleware, checkAdmin, townController.update);
townAdminRouter.delete('/delete/:id', tokenAuthMiddleware, checkAdmin, townController.delete);

module.exports = townAdminRouter;
