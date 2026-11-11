const { Router } = require('express');
const policyController = require('../../controllers/admin/policyController');
const { tokenAuthMiddleware, checkAdmin } = require("../../middlewares/web/authMiddleware");
const policyRouter = Router();

policyRouter.post('/create-policy', tokenAuthMiddleware, checkAdmin, policyController.create);
policyRouter.put('/update/:id', tokenAuthMiddleware, checkAdmin, policyController.update);

module.exports = policyRouter;