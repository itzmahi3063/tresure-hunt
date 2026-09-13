"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/lib/useTelegram";
import BottomNav from "@/components/BottomNav";
import WalletModal from "@/components/WalletModal";
import { useRouter } from "next/navigation";

export default function WalletPage() {
  const { apiFetch, ready } = useTelegram();
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    apiFetch("/api/user").then(setProfile).catch(() => {});
  }, [ready]);

  return (
    <main className="px-4 pt-6">
      <h1 className="font-display text-xl shimmer mb-4">Wallet</h1>
      <WalletModal profile={profile} onClose={() => router.push("/")} onUpdate={setProfile} />
      <BottomNav />
    </main>
  );
}
