import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import Task from "@/models/Task";

export async function GET(req) {
  try {
    requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");

    await connectDB();
    const query = section ? { section } : {};
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const body = await req.json();

    if (!body.title || !body.section || !body.type || body.rewardDiamonds == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    const task = await Task.create({
      section: body.section,
      type: body.type,
      title: body.title,
      description: body.description || "",
      imageUrl: body.imageUrl || "",
      url: body.url || "",
      rewardDiamonds: body.rewardDiamonds,
      maxCompletions: body.maxCompletions || null,
      isDaily: body.section === "daily",
      isPublished: !!body.isPublished,
      botIsAdminInTarget: !!body.botIsAdminInTarget
    });

    return NextResponse.json(task);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
