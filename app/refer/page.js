"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/lib/useTelegram";
import BottomNav from "@/components/BottomNav";

export default function ReferPage() {
  const { apiFetch, ready } = useTelegram();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ready) return;
    apiFetch("/api/referral").then(setData).catch(() => {});
  }, [ready]);

  const link = data?.referralLink || "";

  function copyLink() {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="px-4 pt-6">
      <h1 className="font-display text-xl shimmer mb-1">Refer & Earn</h1>
      <p className="text-xs text-gray-400 mb-4">
        Join our channel and community first — every friend you invite after that earns you diamonds, forever.
      </p>

      {/* Total bonus per friend card */}
      <div className="glass-card shadow-glow flex flex-col items-center py-6 mb-4">
        <DiamondBadge />
        <p className="text-xs text-gray-400 mt-3 tracking-wide">TOTAL BONUS PER FRIEND</p>
        <p className="text-3xl font-bold text-diamond glow-text mt-1">
          {data?.totalBonusPerFriend ?? 400} 💎
        </p>
        <p className="text-xs text-gray-500">
          ≈ ${((data?.totalBonusPerFriend ?? 400) * (data?.diamondRate ?? 0.00004)).toFixed(4)}
        </p>
        <span className="mt-2 text-[11px] px-3 py-1 rounded-full bg-gold/10 text-gold">
          + 10% of everything they withdraw, forever
        </span>

        <div className="w-full mt-4 diamond-pill flex items-center justify-between px-3 py-2">
          <span className="text-xs text-gray-300 truncate mr-2">{link || "Loading link..."}</span>
          <button onClick={copyLink} className="text-diamond text-xs flex-shrink-0">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="w-full grid grid-cols-2 gap-2 mt-3">
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join Treasure Hunt and start earning diamonds!")}`}
            target="_blank" rel="noreferrer"
            className="text-center py-2.5 rounded-xl bg-gradient-to-r from-diamond to-accentPurple text-sm font-semibold"
          >
            Share Now
          </a>
          <button onClick={copyLink} className="py-2.5 rounded-xl border border-white/10 text-sm font-semibold">
            Copy Link
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card px-4 py-3">
          <p className="text-xs text-gray-400">Total referrals</p>
          <p className="text-xl font-bold text-diamond">{data?.totalReferrals ?? 0}</p>
        </div>
        <div className="glass-card px-4 py-3">
          <p className="text-xs text-gray-400">Referral earnings</p>
          <p className="text-xl font-bold text-diamond">{data?.referralEarnings ?? 0} 💎</p>
          <p className="text-[11px] text-gray-500">
            ≈ ${((data?.referralEarnings ?? 0) * (data?.diamondRate ?? 0.00004)).toFixed(4)} USD
          </p>
        </div>
      </div>

      <div className="glass-card px-4 py-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Withdrawal commission</p>
          <p className="text-[11px] text-gray-500">10% of every withdrawal your referrals make — forever.</p>
        </div>
        <p className="text-lg font-bold text-gold flex-shrink-0 ml-3">
          {data?.commissionEarned ?? 0} 💎
        </p>
      </div>

      {/* How it works */}
      <h3 className="text-sm font-semibold text-gray-300 mb-2">How the bonus works</h3>
      <div className="space-y-2">
        {[
          ["Friend joins channel + community and verifies", 30],
          ["Friend completes 5 tasks", 100],
          ["Friend watches 20 ads", 180],
          ["Friend claims their first chest", 90]
        ].map(([label, amt], i) => (
          <div key={i} className="glass-card flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-accentPurple/30 flex items-center justify-center text-xs font-bold">{i + 1}</span>
              <p className="text-sm">{label}</p>
            </div>
            <span className="text-diamond text-sm font-semibold flex-shrink-0">+{amt}</span>
          </div>
        ))}
        <div className="glass-card flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔑</span>
            <p className="text-sm">Every time they withdraw, after that</p>
          </div>
          <span className="text-gold text-sm font-semibold flex-shrink-0">+10%</span>
        </div>
      </div>

      <div className="glass-card px-4 py-3 mt-4">
        <p className="text-xs font-semibold text-diamond mb-1">✅ When does a referral become "valid"?</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          A referral counts toward your withdrawals once your friend has completed both — 5 tasks
          and 20 ads (doesn't matter which order). Joining the channel alone, or just one of the two, isn't enough yet.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}

function DiamondBadge() {
  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-diamond to-accentPurple flex items-center justify-center shadow-glow">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M2 9l5-6h10l5 6-10 12L2 9z" fill="white" />
      </svg>
    </div>
  );
}
