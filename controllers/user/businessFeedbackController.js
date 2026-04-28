const { fn, col } = require("sequelize");
const sequelize = require("../../config/dbConfig");
const User = require("../../models/user");
const MsmeInformation = require("../../models/msmeInformation");
const BusinessRating = require("../../models/businessRating");
const BusinessReview = require("../../models/businessReview");

const buildBusinessRatingSummary = async (businessId, transaction = null) => {
  const [averageRow, totalCount, groupedRows] = await Promise.all([
    BusinessRating.findOne({
      where: { businessId },
      attributes: [[fn("AVG", col("score")), "averageScore"]],
      raw: true,
      transaction,
    }),
    BusinessRating.count({ where: { businessId }, transaction }),
    BusinessRating.findAll({
      where: { businessId },
      attributes: ["score", [fn("COUNT", col("id")), "count"]],
      group: ["score"],
      raw: true,
      transaction,
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
  const transaction = await sequelize.transaction();
  try {
    const { userId = null, businessId, score, review } = req.body;
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

    const [user, business] = await Promise.all([
      userId
        ? User.findOne({
            where: { id: userId },
            attributes: ["id", "firstName", "lastName", "profileImage"],
            transaction,
          })
        : null,
      MsmeInformation.findOne({ where: { id: businessId }, transaction }),
    ]);

    if (!business) {
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found.",
      });
    }
    if (userId && !user) {
      return res.status(404).json({
        status: "FAILURE",
        message: "User not found.",
      });
    }

    if (userId) {
      const existingRating = await BusinessRating.findOne({
        where: { userId, businessId },
        transaction,
      });

      if (existingRating) {
        await existingRating.update({ score: numericScore }, { transaction });
      } else {
        await BusinessRating.create({
          userId,
          businessId,
          score: numericScore,
        }, { transaction });
      }
    } else {
      await BusinessRating.create({
        userId: null,
        businessId,
        score: numericScore,
      }, { transaction });
    }

    await BusinessReview.create({
      userId,
      businessId,
      review: sanitizedReview,
      rating: numericScore,
      reviewImage,
    }, { transaction });

    const ratingSummary = await buildBusinessRatingSummary(businessId, transaction);
    await transaction.commit();

    return res.status(201).json({
      status: "SUCCESS",
      message: "Business feedback submitted successfully.",
      data: ratingSummary,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};

exports.getBusinessFeedback = async (req, res) => {
  const transaction = await sequelize.transaction();
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

    const business = await MsmeInformation.findOne({ where: { id: businessId }, transaction });
    if (!business) {
      await transaction.rollback();
      return res.status(404).json({
        status: "FAILURE",
        message: "Business not found.",
      });
    }

    const ratingSummary = await buildBusinessRatingSummary(businessId, transaction);
    const { count, rows } = await BusinessReview.findAndCountAll({
      where: { businessId },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "profileImage"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      transaction,
    });

    await transaction.commit();

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
    await transaction.rollback();
    return res.status(500).json({
      status: "FAILURE",
      message: "Internal server error: " + error.message,
    });
  }
};
