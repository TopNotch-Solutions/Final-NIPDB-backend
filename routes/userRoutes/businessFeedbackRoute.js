const { Router } = require("express");
const businessFeedbackController = require("../../controllers/user/businessFeedbackController");
const { tokenAuthMiddleware } = require("../../middlewares/mobile/authMiddleware");
const { checkUser } = require("../../middlewares/mobile/authMiddleware");
const reviewUploadMiddleware = require("../../middlewares/shared/reviewUploadMiddleware");

const businessFeedbackUserRouter = Router();

businessFeedbackUserRouter.post(
  "/submit",
  tokenAuthMiddleware,
  checkUser,
  reviewUploadMiddleware.uploadSingle,
  businessFeedbackController.submitBusinessFeedback
);

businessFeedbackUserRouter.get(
  "/:businessId",
  tokenAuthMiddleware,
  checkUser,
  businessFeedbackController.getBusinessFeedback
);

module.exports = businessFeedbackUserRouter;
