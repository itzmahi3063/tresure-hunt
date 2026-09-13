import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import { rateLimit, todayKey, isPlausibleAdWatch } from "@/lib/security";
import User from "@/models/User";
import Settings from "@/models/Settings";

const VALID_NETWORKS = ["adsgram", "monetag"];

export async function POST(req) {
  try {
    const tgUser = requireTelegramUser(req);
    const { network, startedAt } = await req.json();

    if (!VALID_NETWORKS.includes(network)) {
      return NextResponse.json({ error: "Unknown ad network" }, { status: 400 });
    }
    if (!rateLimit(`ad:${tgUser.id}:${network}`, { maxCalls: 15, windowMs: 60_000 })) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
    }
    if (!isPlausibleAdWatch(startedAt)) {
      return NextResponse.json({ error: "Ad watch could not be verified. Please watch the full ad." }, { status: 400 });
    }

    await connectDB();
    const [user, settings] = await Promise.all([
      User.findOne({ telegramId: String(tgUser.id) }),
      Settings.findOne({ key: "global" })
    ]);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

    const hidden = new Set(settings?.hiddenAdNetworks || []);
    if (hidden.has(network)) {
      return NextResponse.json({ error: "This ad network is currently unavailable" }, { status: 400 });
    }

    const today = todayKey();
    if (user.dailyProgress?.date !== today) {
      user.dailyProgress = { date: today, adsWatched: new Map() };
    }
    if (!(user.dailyProgress.adsWatched instanceof Map)) {
      user.dailyProgress.adsWatched = new Map(Object.entries(user.dailyProgress.adsWatched || {}));
    }

    const cap = settings?.dailyAdCapPerNetwork ?? 10;
    const watchedToday = user.dailyProgress.adsWatched.get(network) || 0;
    if (watchedToday >= cap) {
      return NextResponse.json({ error: "Daily limit reached for this ad network" }, { status: 400 });
    }

    const reward = settings?.adRewards?.[network] ?? 0;
    user.dailyProgress.adsWatched.set(network, watchedToday + 1);
    user.diamonds += reward;
    user.markModified("dailyProgress");
    await user.save();

    return NextResponse.json({
      diamonds: user.diamonds,
      watchedToday: watchedToday + 1,
      cap,
      reward
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
