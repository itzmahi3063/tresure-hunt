import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import User from "@/models/User";
import Settings from "@/models/Settings";

export async function GET(req) {
  try {
    const tgUser = requireTelegramUser(req);
    await connectDB();

    const [user, settings] = await Promise.all([
      User.findOne({ telegramId: String(tgUser.id) }),
      Settings.findOne({ key: "global" })
    ]);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const rr = settings?.referralRewards || {};
    const totalBonusPerFriend =
      (rr.friendJoinsVerifies ?? 30) +
      (rr.friendCompletes5Tasks ?? 100) +
      (rr.friendWatches20Ads ?? 180) +
      (rr.friendFirstLootbox ?? 90);

    const botUsername = process.env.BOT_USERNAME || "your_bot";
    const referralLink = `https://t.me/${botUsername}/app?startapp=${user.telegramId}`;

    return NextResponse.json({
      referralLink,
      totalReferrals: user.referralCount,
      referralEarnings: user.referralEarningsDiamonds,
      commissionEarned: 0, // tracked in USDT on the user doc's usdt field when withdrawals happen
      diamondRate: settings?.diamondToUsdtRate ?? 0.00004,
      totalBonusPerFriend
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
