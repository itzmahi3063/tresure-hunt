import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import User from "@/models/User";

export async function GET(req) {
  try {
    requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");
    if (!telegramId) return NextResponse.json({ error: "Missing telegramId" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const { telegramId, deltaDiamonds } = await req.json();
    if (!telegramId || deltaDiamonds == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.diamonds = Math.max(0, user.diamonds + Number(deltaDiamonds));
    await user.save();

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
