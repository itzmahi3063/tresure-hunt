import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "global" },

    diamondToUsdtRate: { type: Number, default: 0.00004 },

    // Ad network coin values, editable from admin panel
    adRewards: {
      adsgram: { type: Number, default: 500 },
      monetag: { type: Number, default: 400 }
    },
    hiddenAdNetworks: [{ type: String }], // e.g. ["monetag"] to temporarily hide a row

    dailyAdCapPerNetwork: { type: Number, default: 10 },
    vipUnlockAdsRequired: { type: Number, default: 30 },
    vipDurationDays: { type: Number, default: 4 },

    requiredChannelUsername: { type: String, default: "" },
    requiredGroupUsername: { type: String, default: "" },
    joinBonusDiamonds: { type: Number, default: 0 },

    minWithdrawUsdt: { type: Number, default: 1 },
    withdrawCooldownMinutes: { type: Number, default: 60 },

    referralRewards: {
      friendJoinsVerifies: { type: Number, default: 30 },
      friendCompletes5Tasks: { type: Number, default: 100 },
      friendWatches20Ads: { type: Number, default: 180 },
      friendFirstLootbox: { type: Number, default: 90 },
      withdrawCommissionPercent: { type: Number, default: 10 }
    }
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
