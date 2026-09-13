"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/lib/useTelegram";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

export default function HomePage() {
  const { user, apiFetch, ready } = useTelegram();
  const [profile, setProfile] = useState(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!ready) return;
    apiFetch("/api/user").then(setProfile).catch(() => {});
  }, [ready]);

  async function openChest() {
    if (opening || !profile || profile.keys < 1) return;
    setOpening(true);
    try {
      const result = await apiFetch("/api/chest/open", { method: "POST" });
      setProfile((p) => ({ ...p, diamonds: result.diamonds, keys: result.keys }));
    } catch (e) {
      // surface via Telegram's native popup if available
      window.Telegram?.WebApp?.showAlert?.(e.message);
    } finally {
      setOpening(false);
    }
  }

  return (
    <main className="px-4 pt-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl shimmer tracking-wide">TREASURE HUNT</h1>
          <p className="text-xs text-gray-400">Dig, earn, and cash out</p>
        </div>
        <div className="diamond-pill px-3 py-2 flex items-center gap-2">
          <DiamondIcon />
          <span className="font-semibold text-diamond glow-text">
            {profile ? profile.diamonds.toLocaleString() : "0"}
          </span>
        </div>
      </header>

      {/* Chest */}
      <div className="glass-card shadow-glow flex flex-col items-center py-10 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_30%,#4fd6ff,transparent_60%)]" />
        <button
          onClick={openChest}
          disabled={opening || !profile || profile.keys < 1}
          className="relative z-10 active:scale-95 transition-transform"
        >
          <ChestIcon glowing={!opening && profile?.keys > 0} />
        </button>
        <button
          onClick={openChest}
          disabled={opening || !profile || profile.keys < 1}
          className="relative z-10 mt-6 px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-diamond to-accentPurple shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {opening ? "Opening..." : "Tap to Open Chest"}
        </button>
        <div className="relative z-10 mt-3 flex items-center gap-1 text-sm text-gray-300">
          <KeyIcon /> {profile ? profile.keys : 0} Keys
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction href="/task" label="Tasks" icon={<TaskGridIcon />} />
        <QuickAction href="/play" label="Spin" icon={<SpinGridIcon />} />
        <QuickAction href="/refer" label="Refer" icon={<ReferGridIcon />} />
        <QuickAction href="/wallet" label="Wallet" icon={<WalletGridIcon />} />
        <QuickAction href="/profile" label="Profile" icon={<ProfileGridIcon />} />
        <QuickAction href="/task?section=daily" label="Watch Ads" icon={<AdsGridIcon />} />
      </div>

      <BottomNav />
    </main>
  );
}

function QuickAction({ href, label, icon }) {
  return (
    <Link href={href} className="glass-card flex flex-col items-center justify-center gap-2 py-4 active:scale-95 transition-transform">
      {icon}
      <span className="text-xs text-gray-300">{label}</span>
    </Link>
  );
}

function DiamondIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M2 9l5-6h10l5 6-10 12L2 9z" fill="#4fd6ff" stroke="#7be8ff" strokeWidth="0.5" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="7" cy="12" r="4" stroke="#f5c542" strokeWidth="1.6" />
      <path d="M11 12h10M17 12v4M21 12v3" stroke="#f5c542" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ChestIcon({ glowing }) {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" className={glowing ? "drop-shadow-[0_0_20px_rgba(245,197,66,0.6)]" : ""}>
      <rect x="10" y="45" width="100" height="45" rx="8" fill="#3a2a12" stroke="#f5c542" strokeWidth="2" />
      <path d="M10 45c0-20 22-32 50-32s50 12 50 32" fill="#4a3418" stroke="#f5c542" strokeWidth="2" />
      <rect x="52" y="55" width="16" height="20" rx="3" fill="#f5c542" />
    </svg>
  );
}
function TaskGridIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#4fd6ff" strokeWidth="1.6" /><path d="M8 8h8M8 12h8M8 16h5" stroke="#4fd6ff" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}
function SpinGridIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#8a5cf6" strokeWidth="1.6" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="#8a5cf6" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}
function ReferGridIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="#f5c542" strokeWidth="1.6" /><circle cx="16" cy="13" r="3" stroke="#f5c542" strokeWidth="1.6" /></svg>;
}
function WalletGridIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="#4fd6ff" strokeWidth="1.6" /><path d="M16 12h3" stroke="#4fd6ff" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}
function ProfileGridIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#8a5cf6" strokeWidth="1.6" /><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" stroke="#8a5cf6" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}
function AdsGridIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="12" rx="2" stroke="#f5c542" strokeWidth="1.6" /><path d="M9 21h6" stroke="#f5c542" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}
