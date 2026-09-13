import mongoose from "mongoose";

const PendingWithdrawalSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, index: true },
    username: { type: String, default: "" },
    amountUsdt: { type: Number, required: true },
    usdtAddress: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "rejected"],
      default: "pending",
      index: true
    },
    adminNote: { type: String, default: "" },
    processedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.models.PendingWithdrawal ||
  mongoose.model("PendingWithdrawal", PendingWithdrawalSchema);
