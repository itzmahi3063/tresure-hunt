import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import Settings from "@/models/Settings";

// Anything here is safe to show to regular users (not admin-only secrets) —
// currently just the numbers that appear directly in the UI.
export async function GET(req) {
  try {
    requireTelegramUser(req);
    await connectDB();
    const settings = await Settings.findOne({ key: "global" });

    return NextResponse.json({
      diamondToUsdtRate: settings?.diamondToUsdtRate ?? 0.00004,
      minWithdrawUsdt: settings?.minWithdrawUsdt ?? 1
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
