"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/lib/useTelegram";
import BottomNav from "@/components/BottomNav";
import WalletModal from "@/components/WalletModal";

export default function ProfilePage() {
  const { user, apiFetch, ready } = useTelegram();
  const [profile, setProfile] = useState(null);
  const [showWallet, setShowWallet] = useState(false);

  useEffect(() => {
    if (!ready) return;
    apiFetch("/api/user").then(setProfile).catch(() => {});
  }, [ready]);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Treasure Hunter";

  return (
    <main className="px-4 pt-6">
      <h1 className="font-display text-xl shimmer mb-4">Profile</h1>

      {/* Real Telegram user card */}
      <div className="glass-card px-4 py-4 flex items-center gap-4 mb-4">
        {user?.photo_url ? (
          <img src={user.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-diamond/40" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-accentPurple/30 flex items-center justify-center text-2xl font-bold border-2 border-diamond/40">
            {displayName[0]}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold truncate">{displayName}</p>
          <p className="text-xs text-gray-400 truncate">@{user?.username || "no_username"}</p>
          <p className="text-[11px] text-gray-500">ID: {user?.id}</p>
        </div>
      </div>

      {/* Balances — real numbers, start at 0 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox label="Diamonds" value={profile?.diamonds ?? 0} icon="💎" />
        <StatBox label="USDT" value={(profile?.usdt ?? 0).toFixed(4)} icon="💵" />
        <StatBox label="Referrals" value={profile?.referralCount ?? 0} icon="👥" />
      </div>

      <button
        onClick={() => setShowWallet(true)}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-diamond to-accentPurple font-semibold mb-3"
      >
        Open Wallet
      </button>

      <div className="glass-card divide-y divide-white/5">
        <ProfileRow label="VIP Tier" value={profile?.vipTier ? `VIP ${profile.vipTier}` : "None"} />
        <ProfileRow label="Member since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"} />
      </div>

      {showWallet && <WalletModal profile={profile} onClose={() => setShowWallet(false)} onUpdate={setProfile} />}
      <BottomNav />
    </main>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div className="glass-card flex flex-col items-center py-3">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-bold mt-1">{value}</span>
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}
function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between px-4 py-3 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
