import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import Settings from "@/models/Settings";

async function getOrCreateSettings() {
  let settings = await Settings.findOne({ key: "global" });
  if (!settings) settings = await Settings.create({ key: "global" });
  return settings;
}

export async function GET(req) {
  try {
    requireAdmin(req);
    await connectDB();
    const settings = await getOrCreateSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

// Partial update — send only the fields you're changing.
export async function POST(req) {
  try {
    requireAdmin(req);
    const updates = await req.json();

    await connectDB();
    const settings = await getOrCreateSettings();

    if (updates.diamondToUsdtRate != null) settings.diamondToUsdtRate = Number(updates.diamondToUsdtRate);
    if (updates.minWithdrawUsdt != null) settings.minWithdrawUsdt = Number(updates.minWithdrawUsdt);
    if (updates.withdrawCooldownMinutes != null) settings.withdrawCooldownMinutes = Number(updates.withdrawCooldownMinutes);
    if (updates.dailyAdCapPerNetwork != null) settings.dailyAdCapPerNetwork = Number(updates.dailyAdCapPerNetwork);
    if (updates.vipUnlockAdsRequired != null) settings.vipUnlockAdsRequired = Number(updates.vipUnlockAdsRequired);
    if (updates.vipDurationDays != null) settings.vipDurationDays = Number(updates.vipDurationDays);
    if (updates.requiredChannelUsername != null) settings.requiredChannelUsername = updates.requiredChannelUsername;
    if (updates.requiredGroupUsername != null) settings.requiredGroupUsername = updates.requiredGroupUsername;
    if (updates.joinBonusDiamonds != null) settings.joinBonusDiamonds = Number(updates.joinBonusDiamonds);

    if (updates.adRewards) {
      settings.adRewards = { ...settings.adRewards, ...updates.adRewards };
    }
    if (updates.hiddenAdNetworks) {
      settings.hiddenAdNetworks = updates.hiddenAdNetworks; // full replacement array, e.g. ["monetag"]
    }
    if (updates.referralRewards) {
      settings.referralRewards = { ...settings.referralRewards, ...updates.referralRewards };
    }

    await settings.save();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
