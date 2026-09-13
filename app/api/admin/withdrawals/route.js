import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import PendingWithdrawal from "@/models/PendingWithdrawal";
import User from "@/models/User";

export async function GET(req) {
  try {
    requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    await connectDB();
    const withdrawals = await PendingWithdrawal.find({ status }).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(withdrawals);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const { id, action, adminNote } = await req.json(); // action: "paid" | "rejected"
    if (!id || !["paid", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await connectDB();
    const withdrawal = await PendingWithdrawal.findById(id);
    if (!withdrawal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (withdrawal.status !== "pending") {
      return NextResponse.json({ error: "Already processed" }, { status: 400 });
    }

    withdrawal.status = action;
    withdrawal.adminNote = adminNote || "";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Rejecting a withdrawal refunds the user's balance — the money was
    // deducted the moment they requested it, so a rejection must give it back.
    if (action === "rejected") {
      await User.updateOne(
        { telegramId: withdrawal.telegramId },
        { $inc: { usdt: withdrawal.amountUsdt } }
      );
    }

    return NextResponse.json(withdrawal);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
