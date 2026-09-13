import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireTelegramUser } from "@/lib/telegramAuth";
import { rateLimit, todayKey, isPlausibleAdWatch } from "@/lib/security";
import Task from "@/models/Task";
import User from "@/models/User";

/**
 * Calls Telegram's getChatMember to confirm the user is ACTUALLY in the
 * channel/group right now. This is what makes "join channel" tasks real —
 * without it, anyone could click "Go" and claim the reward without joining.
 * Requires the bot to be an admin of the target chat (task.botIsAdminInTarget).
 */
async function isRealChatMember(chatUsername, telegramUserId) {
  const botToken = process.env.BOT_TOKEN;
  const chat = chatUsername.startsWith("@") ? chatUsername : `@${chatUsername}`;
  const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${telegramUserId}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) return { ok: false, reason: data.description || "lookup_failed" };
  const status = data.result.status; // "creator" | "administrator" | "member" | "restricted" | "left" | "kicked"
  return { ok: ["creator", "administrator", "member", "restricted"].includes(status) };
}

export async function POST(req) {
  try {
    const tgUser = requireTelegramUser(req);
    const { taskId, startedAt } = await req.json();
    if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });

    if (!rateLimit(`task-complete:${tgUser.id}`, { maxCalls: 20, windowMs: 60_000 })) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
    }

    await connectDB();
    const [task, user] = await Promise.all([
      Task.findById(taskId),
      User.findOne({ telegramId: String(tgUser.id) })
    ]);
    if (!task || !task.isPublished || task.isHidden) {
      return NextResponse.json({ error: "Task not available" }, { status: 404 });
    }
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

    const today = todayKey();
    const completionKey = task.isDaily ? `${task._id}:${today}` : String(task._id);

    if (user.completedTaskIds.includes(completionKey)) {
      return NextResponse.json({ error: "Already completed" }, { status: 400 });
    }
    if (task.maxCompletions != null && task.completions >= task.maxCompletions) {
      return NextResponse.json({ error: "This task has reached its completion limit" }, { status: 400 });
    }

    // Real verification for channel/group tasks — this is the anti-cheat core.
    if (task.type === "channel" || task.type === "group") {
      if (!task.botIsAdminInTarget) {
        return NextResponse.json({ error: "This task isn't verifiable yet. Try again later." }, { status: 400 });
      }
      const membership = await isRealChatMember(task.url, tgUser.id);
      if (!membership.ok) {
        return NextResponse.json({ error: "Join the channel/group first, then come back and tap Go." }, { status: 400 });
      }
    }
    // Ad-network tasks: the SDK's reward callback fires client-side, which is
    // spoofable, so we also sanity-check that real wall-clock time actually
    // passed for a full ad view before crediting anything.
    if (task.type === "ad_network") {
      if (!isPlausibleAdWatch(startedAt)) {
        return NextResponse.json({ error: "Ad watch could not be verified. Please watch the full ad." }, { status: 400 });
      }
    }
    // bot_or_website tasks: no membership check possible — credited on click, same as spec.

    user.completedTaskIds.push(completionKey);
    user.diamonds += task.rewardDiamonds;
    user.keys += 1; // every completed task also drops a chest key
    await user.save();

    task.completions += 1;
    await task.save();

    return NextResponse.json({
      task: { _id: task._id, userCompleted: true },
      diamonds: user.diamonds,
      keys: user.keys
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
