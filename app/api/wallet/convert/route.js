import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import { rateLimit } from "@/lib/security";
import User from "@/models/User";
import Settings from "@/models/Settings";

export async function POST(req) {
  try {
    const tgUser = requireTelegramUser(req);
    const { diamondAmount } = await req.json();

    if (!rateLimit(`convert:${tgUser.id}`, { maxCalls: 10, windowMs: 60_000 })) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
    }
    if (!diamondAmount || diamondAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await connectDB();
    const [user, settings] = await Promise.all([
      User.findOne({ telegramId: String(tgUser.id) }),
      Settings.findOne({ key: "global" })
    ]);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    if (diamondAmount > user.diamonds) {
      return NextResponse.json({ error: "Insufficient diamond balance" }, { status: 400 });
    }

    const rate = settings?.diamondToUsdtRate ?? 0.00004; // admin-editable, single source of truth
    const converted = diamondAmount * rate;

    user.diamonds -= diamondAmount;
    user.usdt += converted;
    await user.save();

    return NextResponse.json({ diamonds: user.diamonds, usdt: user.usdt, converted });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
