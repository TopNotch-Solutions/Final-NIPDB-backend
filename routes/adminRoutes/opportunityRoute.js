const {Router} = require('express');
const opportunityController = require('../../controllers/admin/opportunityController');
const {tokenAuthMiddleware} = require("../../middlewares/web/authMiddleware");
const {checkAdmin} = require('../../middlewares/web/authMiddleware');
const opportunitiesUploadMiddleware = require('../../middlewares/shared/opportunitiesUploadMiddleware');
const opportunityAdminRouter = Router();

opportunityAdminRouter.post('/create',  opportunitiesUploadMiddleware.uploadSingle, opportunityController.create); // send notification to the users

opportunityAdminRouter.get('/all',tokenAuthMiddleware, checkAdmin, opportunityController.all);
opportunityAdminRouter.get('/single/:id',tokenAuthMiddleware, checkAdmin, opportunityController.single);

opportunityAdminRouter.put('/update/:id', opportunitiesUploadMiddleware.uploadSingle, opportunityController.update); // send notification to the users

opportunityAdminRouter.delete('/delete/:id',tokenAuthMiddleware, checkAdmin, opportunityController.delete);

module.exports = opportunityAdminRouter;