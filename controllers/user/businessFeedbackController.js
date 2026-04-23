const { fn, col } = require("sequelize");
const crypto = require("crypto");
const User = require("../../models/user");
const MsmeInformation = require("../../models/msmeInformation");
const BusinessRating = require("../../models/businessRating");
const BusinessReview = require("../../models/businessReview");

const buildAnonymousAlias = (req) => {
  const providedAnonymousId = req.header("x-anonymous-id");
  const source =
    (providedAnonymousId && String(providedAnonymousId).trim()) ||
    `${req.ip || ""}|${req.header("user-agent") || ""}`;

  const hash = crypto.createHash("sha256").update(source).digest("hex");
  const suffix = ((parseInt(hash.slice(0, 8), 16) % 1000) + 1).toString().padStart(3, "0");
  return `Anonymous${suffix}`;
};

const buildBusinessRatingSummary = async (businessId) => {
  const [averageRow, totalCount, groupedRows] = await Promise.all([
    BusinessReview.findOne({
      where: { businessId },
      attributes: [[fn("AVG", col("rating")), "averageScore"]],
      raw: true,
    }),
    BusinessReview.count({ where: { businessId } }),
    BusinessReview.findAll({
      where: { businessId },
      attributes: ["rating", [fn("COUNT", col("id")), "count"]],
      group: ["rating"],
      raw: true,
    }),
  ]);

  const grouped = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  groupedRows.forEach((row) => {
    grouped[Number(row.rating)] = Number(row.count) || 0;
  });

  const stars = [1, 2, 3, 4, 5].map((star) => {
    const count = grouped[star];
    const percentage = totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(2)) : 0;
    return { star, count, percentage };
  });

  return {
    businessId,
    averageScore: totalCount > 0 ? Number((Number(averageRow?.averageScore || 0)).toFixed(2)) : 0,
    totalRatings: totalCount,
    stars,
  };
};

exports.submitBusinessFeedback = async (req, res) => {
  try {
    const userIdFromBody = req.body?.userId ?? req.body?.useId ?? null;
    const parsedUserIdFromBody =
      userIdFromBody !== null && userIdFromBody !== undefined && String(userIdFromBody).trim() !== ""
        ? Number(userIdFromBody)
        : null;
    const userId = req.user?.id || (Number.isInteger(parsedUserIdFromBody) ? parsedUserIdFromBody : null);
    const { businessId, score, review } = req.body;
    const reviewImage = req.file ? `reviews/${req.file.filename}` : null;

    if (!businessId || !score || !review) {
      return res.status(400).json({
        status: "FAILURE",
        message: "businessId, score and review are required.",
      });
    }

    const numericScore = Number(score);
    if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
      return res.status(400).json({
        status: "FAILURE",
        message: "score must be an integer between 1 and 5.",
      });
    }

    const sanitizedReview = String(review).trim();
    if (!sanitizedReview) {
      return res.status(400).json({
        status: "FAILURE",
        message: "review cannot be empty.",
      });
    }

    const business = await MsmeInformation.findOne({ where: { id: businessId } });

    if (!business) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found.",
      });
    }

    if (userId) {
      const user = await User.findOne({
        where: { id: userId },
        attributes: ["id"],
      });

      if (!user) {
        return res.status(404).json({
          status: "FAILURE",
          message: "User not found.",
        });
      }

      const existingRating = await BusinessRating.findOne({
        where: { userId, businessId },
      });

      if (existingRating) {
        await existingRating.update({ score: numericScore });
      } else {
        await BusinessRating.create({
          userId,
          businessId,
          score: numericScore,
        });
      }
    }

    await BusinessReview.create({
      userId,
      businessId,
      review: sanitizedReview,
      rating: numericScore,
      reviewImage,
      anonymousAlias: userId ? null : buildAnonymousAlias(req),
    });

    const ratingSummary = await buildBusinessRatingSummary(businessId);

    return res.status(201).json({
      status: "SUCCESS",
      message: "Business feedback submitted successfully.",
      data: ratingSummary,
    });
  } catch (error) {
    if (
      error?.name === "SequelizeValidationError" &&
      Array.isArray(error?.errors) &&
      error.errors.some((entry) => entry?.path === "userId" && entry?.type === "notNull Violation")
    ) {
      return res.status(400).json({
        status: "FAILURE",
        message:
          "Anonymous feedback is not enabled in this environment yet. Provide a valid userId in the request body.",
      });
    }

    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.getBusinessFeedback = async (req, res) => {
  try {
    const { businessId } = req.params;
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 20;
    const offset = (page - 1) * limit;

    if (!businessId) {
      return res.status(400).json({
        status: "FAILURE",
        message: "businessId is required.",
      });
    }

    const business = await MsmeInformation.findOne({ where: { id: businessId } });
    if (!business) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found.",
      });
    }

    const ratingSummary = await buildBusinessRatingSummary(businessId);
    const { count, rows } = await BusinessReview.findAndCountAll({
      where: { businessId },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "profileImage"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const reviews = rows.map((entry) => {
      const review = entry.toJSON();
      if (!review.User) {
        review.User = {
          id: null,
          firstName: review.anonymousAlias || "Anonymous",
          lastName: "",
          profileImage: null,
        };
      }
      return review;
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business feedback retrieved successfully.",
      data: {
        ...ratingSummary,
        reviews,
      },
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
