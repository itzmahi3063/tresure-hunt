"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/lib/useTelegram";
import BottomNav from "@/components/BottomNav";
import { showAd } from "@/lib/adSdk";

const SECTIONS = [
  { key: "daily", label: "Daily" },
  { key: "social", label: "Social" },
  { key: "exclusive", label: "Exclusive" },
  { key: "partner", label: "Partner" }
];

export default function TaskPage() {
  const { apiFetch, ready } = useTelegram();
  const [section, setSection] = useState("daily");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    apiFetch(`/api/tasks?section=${section}`)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [ready, section]);

  async function handleGo(task) {
    // Ad-network tasks: show the rewarded ad via its SDK, then only credit
    // once the SDK confirms it actually played (see completeTask below).
    if (task.type === "ad_network") {
      return watchAd(task);
    }
    if (task.url) {
      const link = task.type === "channel" || task.type === "group"
        ? `https://t.me/${task.url.replace("@", "")}`
        : task.url;
      window.Telegram?.WebApp?.openLink?.(link) || window.open(link, "_blank");
    }
    try {
      const result = await apiFetch("/api/tasks/complete", {
        method: "POST",
        body: JSON.stringify({ taskId: task._id })
      });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, ...result.task } : t)));
    } catch (e) {
      window.Telegram?.WebApp?.showAlert?.(e.message);
    }
  }

  async function watchAd(task) {
    const startedAt = Date.now();
    // Wire the real SDK show-ad call here, e.g.:
    //   window.Adsgram?.init({ blockId: process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID })
    //     .show().then(() => completeAd(task, startedAt))
    // Left as a stub since the SDK block IDs are set per-network in your dashboard.
    try {
      await new Promise((resolve) => setTimeout(resolve, 15000)); // placeholder for the real ad SDK promise
      const result = await apiFetch("/api/tasks/complete", {
        method: "POST",
        body: JSON.stringify({ taskId: task._id, startedAt })
      });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, ...result.task } : t)));
    } catch (e) {
      window.Telegram?.WebApp?.showAlert?.(e.message);
    }
  }

  return (
    <main className="px-4 pt-6">
      <h1 className="font-display text-xl shimmer mb-1">Tasks</h1>
      <p className="text-xs text-gray-400 mb-4">Complete tasks and grow your treasure</p>

      <div className="diamond-pill flex p-1 mb-4">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              section === s.key ? "bg-diamond/20 text-diamond glow-text" : "text-gray-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "daily" && <AdsSection apiFetch={apiFetch} ready={ready} />}

      {section === "exclusive" && (
        <button
          onClick={() => setShowSubmitModal(true)}
          className="w-full glass-card flex items-center justify-between px-4 py-3 mb-3 active:scale-95 transition-transform"
        >
          <span className="text-sm font-medium text-gold">+ Add your own task</span>
          <span className="text-gray-400">›</span>
        </button>
      )}

      <div className="space-y-3">
        {loading && <p className="text-center text-gray-500 text-sm py-8">Loading tasks...</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">No tasks here right now — check back soon.</p>
        )}
        {tasks.map((task) => (
          <TaskRow key={task._id} task={task} onGo={() => handleGo(task)} />
        ))}
      </div>

      {section === "social" && (
        <div className="glass-card px-4 py-3 mt-4">
          <h3 className="text-sm font-semibold text-diamond mb-1">How rewards land</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Every reward is checked on our server the moment you finish a task — no waiting,
            no guessing. Join, watch, or complete, and your diamonds land the instant it's verified.
          </p>
        </div>
      )}

      {showSubmitModal && <SubmitTaskModal onClose={() => setShowSubmitModal(false)} />}
      <BottomNav />
    </main>
  );
}

function AdsSection({ apiFetch, ready }) {
  const [networks, setNetworks] = useState([]);
  const [watching, setWatching] = useState(null);

  useEffect(() => {
    if (!ready) return;
    apiFetch("/api/ads").then((res) => setNetworks(res.networks)).catch(() => {});
  }, [ready]);

  async function watch(network) {
    setWatching(network.key);
    const startedAt = Date.now();
    try {
      await showAd(network.key);
      const result = await apiFetch("/api/ads/complete", {
        method: "POST",
        body: JSON.stringify({ network: network.key, startedAt })
      });
      setNetworks((prev) =>
        prev.map((n) => (n.key === network.key ? { ...n, watchedToday: result.watchedToday } : n))
      );
    } catch (e) {
      window.Telegram?.WebApp?.showAlert?.(e.message || "Ad couldn't be shown right now.");
    } finally {
      setWatching(null);
    }
  }

  if (networks.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="text-xs text-gray-500 mb-2 tracking-wide">WATCH & EARN</p>
      <div className="space-y-3">
        {networks.map((n) => {
          const capped = n.watchedToday >= n.cap;
          return (
            <div key={n.key} className="glass-card px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-gray-400">{n.watchedToday} of {n.cap} done</p>
                </div>
                <button
                  onClick={() => watch(n)}
                  disabled={capped || watching === n.key}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-gold to-diamond disabled:opacity-40 flex-shrink-0"
                >
                  {watching === n.key ? "Watching..." : capped ? "Done" : "Watch"}
                </button>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-diamond"
                  style={{ width: `${Math.min(100, (n.watchedToday / n.cap) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-diamond mt-1.5">+{n.rewardDiamonds} 💎 per clip</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskRow({ task, onGo }) {
  const done = task.userCompleted;
  return (
    <div className="glass-card flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {task.imageUrl ? (
          <img src={task.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-diamond/20 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{task.title}</p>
          <p className="text-xs text-gray-400 truncate">{task.description}</p>
          <p className="text-xs text-diamond mt-0.5">+{task.rewardDiamonds} 💎</p>
        </div>
      </div>
      <button
        onClick={onGo}
        disabled={done}
        className={`px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 ${
          done ? "bg-white/5 text-gray-500" : "bg-gradient-to-r from-diamond to-accentPurple"
        }`}
      >
        {done ? "Done" : "Go"}
      </button>
    </div>
  );
}

function SubmitTaskModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="glass-card w-full p-5 rounded-b-none" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold mb-2">Add your own task</h3>
        <p className="text-sm text-gray-300 mb-4">
          Want to promote your channel or link here? Contact our admin to get your task reviewed and posted.
        </p>
        <a
          href="https://t.me/AppDeveloper99"
          target="_blank"
          rel="noreferrer"
          className="block text-center w-full py-3 rounded-xl bg-gradient-to-r from-diamond to-accentPurple font-semibold"
        >
          Contact Admin
        </a>
        <button onClick={onClose} className="w-full py-3 mt-2 text-sm text-gray-400">Close</button>
      </div>
    </div>
  );
}
