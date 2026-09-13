import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import User from "@/models/User";

export async function GET(req) {
  try {
    const tgUser = requireTelegramUser(req);
    await connectDB();

    let user = await User.findOne({ telegramId: String(tgUser.id) });
    if (!user) {
      user = await User.create({
        telegramId: String(tgUser.id),
        username: tgUser.username || "",
        firstName: tgUser.first_name || "",
        lastName: tgUser.last_name || "",
        photoUrl: tgUser.photo_url || ""
        // diamonds, usdt, keys all default to 0 in the schema — real, not seeded
      });
    } else {
      // keep profile fields fresh in case the user changed their Telegram name/photo
      user.username = tgUser.username || user.username;
      user.firstName = tgUser.first_name || user.firstName;
      user.lastName = tgUser.last_name || user.lastName;
      user.photoUrl = tgUser.photo_url || user.photoUrl;
      await user.save();
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
