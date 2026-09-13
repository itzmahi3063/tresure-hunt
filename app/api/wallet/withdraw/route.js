import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import { rateLimit } from "@/lib/security";
import User from "@/models/User";
import Settings from "@/models/Settings";
import PendingWithdrawal from "@/models/PendingWithdrawal";

export async function POST(req) {
  try {
    const tgUser = requireTelegramUser(req);
    const { amountUsdt, usdtAddress } = await req.json();

    if (!rateLimit(`withdraw:${tgUser.id}`, { maxCalls: 3, windowMs: 60_000 })) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
    }
    if (!amountUsdt || amountUsdt <= 0 || !usdtAddress) {
      return NextResponse.json({ error: "Invalid amount or address" }, { status: 400 });
    }

    await connectDB();
    const [user, settings] = await Promise.all([
      User.findOne({ telegramId: String(tgUser.id) }),
      Settings.findOne({ key: "global" })
    ]);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

    const minWithdraw = settings?.minWithdrawUsdt ?? 1;
    const cooldownMinutes = settings?.withdrawCooldownMinutes ?? 60;

    if (amountUsdt < minWithdraw) {
      return NextResponse.json({ error: `Minimum withdrawal is $${minWithdraw}` }, { status: 400 });
    }
    if (amountUsdt > user.usdt) {
      return NextResponse.json({ error: "Insufficient USDT balance" }, { status: 400 });
    }
    if (user.lastWithdrawAt) {
      const minutesSince = (Date.now() - new Date(user.lastWithdrawAt).getTime()) / 60000;
      if (minutesSince < cooldownMinutes) {
        return NextResponse.json({ error: `Please wait ${Math.ceil(cooldownMinutes - minutesSince)} more minute(s)` }, { status: 429 });
      }
    }

    // Deduct immediately and drop it in a queue you (or an automated payout
    // job) process from the admin panel. The user's balance already reflects
    // the pending deduction, so it can't be spent twice while you process it.
    user.usdt -= amountUsdt;
    user.lastWithdrawAt = new Date();
    await user.save();

    await PendingWithdrawal.create({
      telegramId: user.telegramId,
      username: user.username,
      amountUsdt,
      usdtAddress
    });

    // Credit the referrer's lifetime commission, if any
    if (user.referredBy) {
      const referrer = await User.findOne({ telegramId: user.referredBy });
      if (referrer) {
        const pct = settings?.referralRewards?.withdrawCommissionPercent ?? 10;
        referrer.usdt += amountUsdt * (pct / 100);
        await referrer.save();
      }
    }

    return NextResponse.json({ usdt: user.usdt });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
