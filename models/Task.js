import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      enum: ["daily", "social", "exclusive", "partner"],
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["channel", "group", "bot_or_website", "ad_network"],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    url: { type: String, default: "" }, // channel/group username OR bot/website link

    // For channel/group tasks: the bot must be an admin in the target chat
    // to be able to check membership. This flag is set automatically once
    // your bot confirms admin rights (see bot/index.js -> checkBotAdminStatus).
    botIsAdminInTarget: { type: Boolean, default: false },

    rewardDiamonds: { type: Number, required: true },
    maxCompletions: { type: Number, default: null }, // null = unlimited
    completions: { type: Number, default: 0 },

    isDaily: { type: Boolean, default: false }, // resets progress every day
    isHidden: { type: Boolean, default: false }, // admin can hide from users without deleting
    isPublished: { type: Boolean, default: false },

    // For "Add your own task" (Exclusive tab): user-submitted requests that
    // are NOT auto-published — they just open a contact prompt for you.
    isUserSubmissionPrompt: { type: Boolean, default: false },

    createdBy: { type: String, default: "admin" }
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
