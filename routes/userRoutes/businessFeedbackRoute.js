const { Router } = require("express");
const businessFeedbackController = require("../../controllers/user/businessFeedbackController");
const { optionalUserAuthMiddleware } = require("../../middlewares/mobile/authMiddleware");
const reviewUploadMiddleware = require("../../middlewares/shared/reviewUploadMiddleware");

const businessFeedbackUserRouter = Router();

businessFeedbackUserRouter.post(
  "/submit",
  optionalUserAuthMiddleware,
  reviewUploadMiddleware.uploadSingle,
  businessFeedbackController.submitBusinessFeedback
);

businessFeedbackUserRouter.get(
  "/:businessId",
  businessFeedbackController.getBusinessFeedback
);

module.exports = businessFeedbackUserRouter;
