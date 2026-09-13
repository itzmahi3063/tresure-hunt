"use client";

import BottomNav from "@/components/BottomNav";

export default function PlayPage() {
  return (
    <main className="px-4 pt-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="text-5xl mb-4">🎮</div>
      <h1 className="font-display text-xl shimmer mb-2">Games coming soon</h1>
      <p className="text-sm text-gray-400 max-w-xs">
        We're building mini-games where you can win extra diamonds. Check back soon!
      </p>
      <BottomNav />
    </main>
  );
}
