import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import Task from "@/models/Task";
import User from "@/models/User";
import { todayKey } from "@/lib/security";

export async function GET(req) {
  try {
    const tgUser = requireTelegramUser(req);
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") || "daily";

    await connectDB();
    const user = await User.findOne({ telegramId: String(tgUser.id) });

    const tasks = await Task.find({ section, isPublished: true, isHidden: false }).sort({ createdAt: -1 }).lean();

    const today = todayKey();
    const dailyProgressStale = user?.dailyProgress?.date !== today;

    const annotated = tasks.map((t) => {
      const completedOneTime = user?.completedTaskIds?.includes(String(t._id));
      const completedDaily = t.isDaily && !dailyProgressStale && user?.completedTaskIds?.includes(`${t._id}:${today}`);
      const full = t.maxCompletions != null && t.completions >= t.maxCompletions;
      return {
        ...t,
        userCompleted: t.isDaily ? !!completedDaily : !!completedOneTime || full
      };
    });

    return NextResponse.json(annotated);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
