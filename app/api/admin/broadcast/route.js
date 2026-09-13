import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import User from "@/models/User";

export async function POST(req) {
  try {
    requireAdmin(req);
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    await connectDB();
    const users = await User.find({ isBanned: false }, "telegramId").lean();
    const botToken = process.env.BOT_TOKEN;

    let sent = 0;
    // Telegram allows ~30 messages/sec to distinct chats — batch with a small delay
    // to stay well under that and avoid getting rate-limited mid-broadcast.
    const BATCH_SIZE = 25;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (u) => {
          try {
            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: u.telegramId, text })
            });
            const data = await res.json();
            if (data.ok) sent += 1;
          } catch {
            // user may have blocked the bot — skip silently
          }
        })
      );
      if (i + BATCH_SIZE < users.length) await new Promise((r) => setTimeout(r, 1000));
    }

    return NextResponse.json({ sent, total: users.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
