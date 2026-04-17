const { fn, col } = require("sequelize");
const User = require("../../models/user");
const MsmeInformation = require("../../models/msmeInformation");
const BusinessRating = require("../../models/businessRating");
const BusinessReview = require("../../models/businessReview");

const buildBusinessRatingSummary = async (businessId) => {
  const [averageRow, totalCount, groupedRows] = await Promise.all([
    BusinessRating.findOne({
      where: { businessId },
      attributes: [[fn("AVG", col("score")), "averageScore"]],
      raw: true,
    }),
    BusinessRating.count({ where: { businessId } }),
    BusinessRating.findAll({
      where: { businessId },
      attributes: ["score", [fn("COUNT", col("id")), "count"]],
      group: ["score"],
      raw: true,
    }),
  ]);

  const grouped = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  groupedRows.forEach((row) => {
    grouped[Number(row.score)] = Number(row.count) || 0;
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
    const userId = req.user.id;
    const { businessId, score, review } = req.body;
    const reviewImage = req.file ? `reviews/${req.file.filename}` : null;

    if (!userId || !businessId || !score || !review) {
      return res.status(400).json({
        status: "FAILURE",
        message: "userId, businessId, score and review are required.",
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

    const [user, business] = await Promise.all([
      User.findOne({
        where: { id: userId },
        attributes: ["id", "firstName", "lastName", "profileImage"],
      }),
      MsmeInformation.findOne({ where: { id: businessId } }),
    ]);

    if (!user || !business) {
      return res.status(404).json({
        status: "FAILURE",
        message: "User or business not found.",
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

    await BusinessReview.create({
      userId,
      businessId,
      review: sanitizedReview,
      rating: numericScore,
      reviewImage,
    });

    const ratingSummary = await buildBusinessRatingSummary(businessId);

    return res.status(201).json({
      status: "SUCCESS",
      message: "Business feedback submitted successfully.",
      data: ratingSummary,
    });
  } catch (error) {
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

    return res.status(200).json({
      status: "SUCCESS",
      message: "Business feedback retrieved successfully.",
      data: {
        ...ratingSummary,
        reviews: rows,
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
