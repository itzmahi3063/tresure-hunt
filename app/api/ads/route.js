import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import { todayKey } from "@/lib/security";
import User from "@/models/User";
import Settings from "@/models/Settings";

const NETWORK_LABELS = { adsgram: "Adsgram", monetag: "Monetag" };

export async function GET(req) {
  try {
    const tgUser = requireTelegramUser(req);
    await connectDB();

    const [user, settings] = await Promise.all([
      User.findOne({ telegramId: String(tgUser.id) }),
      Settings.findOne({ key: "global" })
    ]);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const today = todayKey();
    const progressStale = user.dailyProgress?.date !== today;
    const cap = settings?.dailyAdCapPerNetwork ?? 10;
    const hidden = new Set(settings?.hiddenAdNetworks || []);
    const rewards = settings?.adRewards || { adsgram: 500, monetag: 400 };

    const networks = Object.keys(NETWORK_LABELS)
      .filter((key) => !hidden.has(key))
      .map((key) => ({
        key,
        label: NETWORK_LABELS[key],
        rewardDiamonds: rewards[key] ?? 0,
        watchedToday: progressStale ? 0 : (user.dailyProgress?.adsWatched?.get?.(key) ?? user.dailyProgress?.adsWatched?.[key] ?? 0),
        cap
      }));

    return NextResponse.json({ networks, vipProgress: { done: 0, required: settings?.vipUnlockAdsRequired ?? 30 } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
