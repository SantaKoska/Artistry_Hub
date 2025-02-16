const mongoose = require("mongoose");

const LiveClassPaymentSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveClass",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
    },
    artistEarnings: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Add indexes for efficient querying
LiveClassPaymentSchema.index({ classId: 1, studentId: 1 });
LiveClassPaymentSchema.index({ artistId: 1, status: 1 });

const LiveClassPayment = mongoose.model(
  "LiveClassPayment",
  LiveClassPaymentSchema
);

module.exports = LiveClassPayment;
