import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import { rateLimit } from "@/lib/security";
import User from "@/models/User";

// Chest reward table lives on the server only — client never sees or sends amounts.
function rollChestReward() {
  const table = [
    { diamonds: 20, weight: 40 },
    { diamonds: 50, weight: 30 },
    { diamonds: 100, weight: 18 },
    { diamonds: 250, weight: 9 },
    { diamonds: 1000, weight: 3 }
  ];
  const total = table.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const row of table) {
    if (roll < row.weight) return row.diamonds;
    roll -= row.weight;
  }
  return table[0].diamonds;
}

export async function POST(req) {
  try {
    const tgUser = requireTelegramUser(req);

    if (!rateLimit(`chest:${tgUser.id}`, { maxCalls: 10, windowMs: 60_000 })) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
    }

    await connectDB();
    const user = await User.findOne({ telegramId: String(tgUser.id) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

    if (user.keys < 1) {
      return NextResponse.json({ error: "No keys left. Earn keys by completing tasks." }, { status: 400 });
    }

    const reward = rollChestReward();
    user.keys -= 1;
    user.diamonds += reward;
    await user.save();

    return NextResponse.json({ diamonds: user.diamonds, keys: user.keys, reward });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
