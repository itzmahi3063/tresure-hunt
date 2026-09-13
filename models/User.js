import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    photoUrl: { type: String, default: "" },

    // All balances start at zero — these are real, not seeded/fake numbers.
    diamonds: { type: Number, default: 0 },
    usdt: { type: Number, default: 0 },
    keys: { type: Number, default: 0 },

    vipTier: { type: Number, default: 0 },
    vipExpiresAt: { type: Date, default: null },

    referredBy: { type: String, default: null }, // telegramId of referrer
    referralCount: { type: Number, default: 0 },
    referralEarningsDiamonds: { type: Number, default: 0 },

    joinedChannelVerified: { type: Boolean, default: false },
    joinedGroupVerified: { type: Boolean, default: false },

    completedTaskIds: [{ type: String }], // for one-time (non-daily) tasks
    dailyProgress: {
      date: { type: String, default: "" }, // yyyy-mm-dd, reset each day
      adsWatched: { type: Map, of: Number, default: {} } // per network e.g. { adsgram: 3, monetag: 1 }
    },

    lastWithdrawAt: { type: Date, default: null },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
