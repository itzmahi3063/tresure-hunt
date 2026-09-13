import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";

export async function POST(req) {
  try {
    requireAdmin(req);
    const { chatUsername } = await req.json();
    if (!chatUsername) return NextResponse.json({ error: "Missing chatUsername" }, { status: 400 });

    const botToken = process.env.BOT_TOKEN;
    const chat = chatUsername.startsWith("@") ? chatUsername : `@${chatUsername}`;

    // getMe first to know our own bot id
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const me = await meRes.json();
    if (!me.ok) return NextResponse.json({ error: "Bot token invalid" }, { status: 500 });

    const memberRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${me.result.id}`
    );
    const member = await memberRes.json();
    if (!member.ok) {
      return NextResponse.json({ isAdmin: false, reason: member.description || "not_found" });
    }

    const isAdminStatus = ["administrator", "creator"].includes(member.result.status);
    return NextResponse.json({ isAdmin: isAdminStatus });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
