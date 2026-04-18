const {Router} = require('express');
const msmeUserController = require('../../controllers/user/msmeController');
const msmeUserRouter = Router();
const {tokenAuthMiddleware, appTokenMiddleware} = require("../../middlewares/mobile/authMiddleware");
const {checkUser, checkAppUser} = require("../../middlewares/mobile/authMiddleware");
const msmeUploadMiddleware = require('../../middlewares/shared/msmeUploadMiddleware');
const updateBusinessLogoMiddleware = require('../../middlewares/shared/updateBusinessLogoMiddleware');
const updateImage1Middleware = require('../../middlewares/shared/updateImage1Middleware');
const updateImage2Middleware = require('../../middlewares/shared/updateImage2Middleware');
const updateImage3Middleware = require('../../middlewares/shared/updateImage3Middleware');
const updateImage4Middleware = require('../../middlewares/shared/updateImage4Middleware');
const updateImage5Middleware = require('../../middlewares/shared/updateImage5Middleware');
const updateImage6Middleware = require('../../middlewares/shared/updateImage6Middleware');

msmeUserRouter.post('/create', tokenAuthMiddleware, checkUser, msmeUploadMiddleware.uploadMultiple, msmeUserController.create);
msmeUserRouter.post('/like/:businessId', tokenAuthMiddleware, checkUser,  msmeUserController.like);
msmeUserRouter.post('/unlike/:businessId',tokenAuthMiddleware, checkUser,  msmeUserController.unlike);

msmeUserRouter.get('/all/business', appTokenMiddleware, checkAppUser, msmeUserController.all);
msmeUserRouter.get('/filter/industry/:industryName', appTokenMiddleware,checkAppUser, msmeUserController.filterByIndustry);
msmeUserRouter.get('/recent/business', appTokenMiddleware,checkAppUser, msmeUserController.recentlyAdded);

msmeUserRouter.get('/all/region/business/:region', appTokenMiddleware,checkAppUser, msmeUserController.allRegionBusiness);
msmeUserRouter.get('/all/town/business',appTokenMiddleware,checkAppUser, msmeUserController.allTownBusiness);
msmeUserRouter.get('/all/liked', tokenAuthMiddleware, checkUser, msmeUserController.allLiked);
msmeUserRouter.get('/isBusinessLiked/:businessId',tokenAuthMiddleware, checkUser,  msmeUserController.isBusinessLiked);
msmeUserRouter.get('/isVisible/:businessId',tokenAuthMiddleware, checkUser,  msmeUserController.isVisible);
msmeUserRouter.get('/single/:businessId',appTokenMiddleware,checkAppUser, msmeUserController.single);
msmeUserRouter.get('/single/rejected/:businessId', tokenAuthMiddleware, checkUser, msmeUserController.singleRejected);
msmeUserRouter.get('/allUserBusiness', tokenAuthMiddleware, checkUser, msmeUserController.allSingleUserMsme);

msmeUserRouter.put('/update/:businessId', tokenAuthMiddleware, checkUser, msmeUploadMiddleware.uploadMultiple, msmeUserController.update);
msmeUserRouter.put('/updateLogo/:businessId', tokenAuthMiddleware, checkUser, updateBusinessLogoMiddleware.uploadBusinessLogo, msmeUserController.updateLogo);
msmeUserRouter.put('/updateImage1/:businessId',tokenAuthMiddleware, checkUser, updateImage1Middleware.uploadImage1, msmeUserController.updateImage1);
msmeUserRouter.put('/updateImage2/:businessId',tokenAuthMiddleware, checkUser, updateImage2Middleware.uploadImage2, msmeUserController.updateImage2);
msmeUserRouter.put('/updateImage3/:businessId',tokenAuthMiddleware, checkUser, updateImage3Middleware.uploadImage3, msmeUserController.updateImage3);
msmeUserRouter.put('/updateImage4/:businessId',tokenAuthMiddleware, checkUser, updateImage4Middleware.uploadImage4, msmeUserController.updateImage4);
msmeUserRouter.put('/updateImage5/:businessId',tokenAuthMiddleware, checkUser, updateImage5Middleware.uploadImage5, msmeUserController.updateImage5);
msmeUserRouter.put('/updateImage6/:businessId',tokenAuthMiddleware, checkUser, updateImage6Middleware.uploadImage6, msmeUserController.updateImage6);
msmeUserRouter.put('/updateBusinessHours/:businessId', tokenAuthMiddleware, checkUser,  msmeUserController.businessHours);

msmeUserRouter.delete('/delete/:businessId', tokenAuthMiddleware, checkUser,  msmeUserController.delete);
msmeUserRouter.patch('/visibility',tokenAuthMiddleware, checkUser,  msmeUserController.visibility);

module.exports = msmeUserRouter;