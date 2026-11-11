const {Router} = require('express');
const policyController = require('../../controllers/user/policyController');

const policyUserRouter = Router();


policyUserRouter.get('/policies', policyController.policies);


module.exports = policyUserRouter;