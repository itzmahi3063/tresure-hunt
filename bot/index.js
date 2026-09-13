/**
 * Standalone bot process. Run with `npm run bot`.
 *
 * NOTE ON HOSTING: this uses long-polling, which needs a persistent process —
 * it will NOT run on Vercel's serverless functions (they sleep between requests).
 * Host this file on a small always-on box (Railway/Render/a $5 VPS/etc), or
 * convert it to a webhook handler under app/api/telegram-webhook/route.js if
 * you want everything on Vercel. Polling is simplest to get started with.
 */
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = String(process.env.ADMIN_TELEGRAM_ID);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const MONGODB_URI = process.env.MONGODB_URI;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN missing in .env");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Minimal inline User schema (mirrors models/User.js) so this standalone
// process doesn't need Next.js's module resolution.
const UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const User = mongoose.models.User || mongoose.model("User", UserSchema, "users");

mongoose.connect(MONGODB_URI).then(() => console.log("[bot] connected to MongoDB"));

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const referrerId = match?.[1]?.trim();
  const telegramId = String(msg.from.id);

  try {
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({
        telegramId,
        username: msg.from.username || "",
        firstName: msg.from.first_name || "",
        lastName: msg.from.last_name || "",
        diamonds: 0,
        usdt: 0,
        keys: 0,
        referredBy: referrerId && referrerId !== telegramId ? referrerId : null,
        referralCount: 0,
        referralEarningsDiamonds: 0,
        completedTaskIds: []
      });
      // Bump the referrer's count (the diamond bonus itself is granted by
      // your reward-milestone logic once the friend actually completes
      // tasks/ads, per the referral rules — not just for opening the app).
      if (user.referredBy) {
        await User.updateOne({ telegramId: user.referredBy }, { $inc: { referralCount: 1 } });
      }
    }
  } catch (e) {
    console.error("[bot] /start error:", e.message);
  }

  bot.sendMessage(chatId, "💎 Welcome to Treasure Hunt! Tap below to start digging.", {
    reply_markup: {
      inline_keyboard: [[{ text: "🎮 Open Treasure Hunt", web_app: { url: APP_URL } }]]
    }
  });
});

// Strictly gated: only YOUR Telegram ID gets any response to /admin.
// Everyone else's /admin is silently ignored — no error, no hint it exists.
bot.onText(/\/admin/, (msg) => {
  const telegramId = String(msg.from.id);
  if (telegramId !== ADMIN_ID) return; // silent no-op for non-admins

  bot.sendMessage(msg.chat.id, "🔐 Admin Panel", {
    reply_markup: {
      inline_keyboard: [[{ text: "Open Admin Panel", web_app: { url: `${APP_URL}/admin` } }]]
    }
  });
});

console.log("[bot] Treasure Hunt bot running (long polling)...");
