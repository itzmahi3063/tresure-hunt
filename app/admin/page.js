"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/lib/useTelegram";

const SECTIONS = ["daily", "social", "exclusive", "partner"];
const TYPES = [
  { key: "channel", label: "Channel" },
  { key: "group", label: "Group" },
  { key: "bot_or_website", label: "Bot / Website" }
];

export default function AdminPage() {
  const { user, apiFetch, ready } = useTelegram();
  const [tab, setTab] = useState("broadcast");
  const [allowed, setAllowed] = useState(null); // null = checking, false = denied, true = ok

  useEffect(() => {
    if (!ready) return;
    apiFetch("/api/admin/tasks?section=daily")
      .then(() => setAllowed(true))
      .catch(() => setAllowed(false));
  }, [ready]);

  // Non-admins (and anyone outside Telegram) see nothing — not even an error
  // message hinting an admin panel exists here.
  if (allowed === null) return null;
  if (allowed === false) return null;

  return (
    <main className="px-4 pt-6 pb-16 max-w-md mx-auto">
      <h1 className="font-display text-xl shimmer mb-4">Admin Panel</h1>

      <div className="diamond-pill flex p-1 mb-5 overflow-x-auto">
        {["broadcast", "add-task", "user-balance", "economy", "withdrawals"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium whitespace-nowrap px-2 ${
              tab === t ? "bg-diamond/20 text-diamond" : "text-gray-400"
            }`}
          >
            {t === "broadcast" ? "Broadcast" : t === "add-task" ? "Add Task" : t === "user-balance" ? "User Balance" : t === "economy" ? "Economy" : "Withdrawals"}
          </button>
        ))}
      </div>

      {tab === "broadcast" && <BroadcastPanel apiFetch={apiFetch} />}
      {tab === "add-task" && <AddTaskPanel apiFetch={apiFetch} />}
      {tab === "user-balance" && <UserBalancePanel apiFetch={apiFetch} />}
      {tab === "economy" && <EconomyPanel apiFetch={apiFetch} />}
      {tab === "withdrawals" && <WithdrawalsPanel apiFetch={apiFetch} />}
    </main>
  );
}

function BroadcastPanel({ apiFetch }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null);

  async function send() {
    setStatus("sending");
    try {
      const res = await apiFetch("/api/admin/broadcast", { method: "POST", body: JSON.stringify({ text }) });
      setStatus(`Sent to ${res.sent} users`);
      setText("");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <label className="text-xs text-gray-400">Message to broadcast to all users</label>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} rows={5}
        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-diamond"
      />
      <button onClick={send} disabled={!text} className="w-full py-3 rounded-xl bg-gradient-to-r from-diamond to-accentPurple font-semibold disabled:opacity-40">
        Send Broadcast
      </button>
      {status && <p className="text-xs text-gray-400">{status}</p>}
    </div>
  );
}

function AddTaskPanel({ apiFetch }) {
  const [form, setForm] = useState({
    section: "daily", type: "channel", title: "", description: "",
    imageUrl: "", url: "", rewardDiamonds: "", maxCompletions: ""
  });
  const [botAdminStatus, setBotAdminStatus] = useState(null);
  const [status, setStatus] = useState(null);

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function checkBotAdmin() {
    if (form.type === "bot_or_website") return;
    try {
      const res = await apiFetch("/api/admin/tasks/check-bot-admin", {
        method: "POST",
        body: JSON.stringify({ chatUsername: form.url })
      });
      setBotAdminStatus(res.isAdmin);
    } catch {
      setBotAdminStatus(false);
    }
  }

  async function publish() {
    setStatus("publishing");
    try {
      await apiFetch("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          rewardDiamonds: Number(form.rewardDiamonds),
          isPublished: true,
          botIsAdminInTarget: botAdminStatus === true
        })
      });
      setStatus("Published!");
      setForm({ section: "daily", type: "channel", title: "", description: "", imageUrl: "", url: "", rewardDiamonds: "", maxCompletions: "" });
      setBotAdminStatus(null);
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  }

  const needsChannelVerify = form.type === "channel" || form.type === "group";

  return (
    <div className="glass-card p-4 space-y-3">
      <div>
        <label className="text-xs text-gray-400">Section</label>
        <select value={form.section} onChange={(e) => update("section", e.target.value)} className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm">
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-400">Type</label>
        <select value={form.type} onChange={(e) => update("type", e.target.value)} className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm">
          {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>
      <Field label="Task title" value={form.title} onChange={(v) => update("title", v)} />
      <Field label="Description" value={form.description} onChange={(v) => update("description", v)} />
      <Field label="Image URL" value={form.imageUrl} onChange={(v) => update("imageUrl", v)} />
      <Field
        label={needsChannelVerify ? "Channel / Group username" : "Bot / Website URL"}
        value={form.url}
        onChange={(v) => update("url", v)}
        onBlur={needsChannelVerify ? checkBotAdmin : undefined}
      />
      {needsChannelVerify && botAdminStatus === false && (
        <p className="text-xs text-red-400">
          ⚠️ Add the bot as admin in this channel/group for verification to work.
        </p>
      )}
      {needsChannelVerify && botAdminStatus === true && (
        <p className="text-xs text-green-400">✓ Bot is admin — membership can be verified.</p>
      )}
      <Field label="Reward (diamonds)" value={form.rewardDiamonds} onChange={(v) => update("rewardDiamonds", v)} type="number" />
      <Field label="Max completions (blank = unlimited)" value={form.maxCompletions} onChange={(v) => update("maxCompletions", v)} type="number" />

      <button onClick={publish} disabled={!form.title || !form.rewardDiamonds} className="w-full py-3 rounded-xl bg-gradient-to-r from-diamond to-accentPurple font-semibold disabled:opacity-40">
        Publish
      </button>
      {status && <p className="text-xs text-gray-400">{status}</p>}
    </div>
  );
}

function UserBalancePanel({ apiFetch }) {
  const [telegramId, setTelegramId] = useState("");
  const [found, setFound] = useState(null);
  const [delta, setDelta] = useState("");
  const [status, setStatus] = useState(null);

  async function lookup() {
    setStatus("looking up...");
    try {
      const res = await apiFetch(`/api/admin/user-balance?telegramId=${telegramId}`);
      setFound(res);
      setStatus(null);
    } catch (e) {
      setFound(null);
      setStatus("Error: " + e.message);
    }
  }

  async function adjust() {
    try {
      const res = await apiFetch("/api/admin/user-balance", {
        method: "POST",
        body: JSON.stringify({ telegramId, deltaDiamonds: Number(delta) })
      });
      setFound(res);
      setDelta("");
      setStatus("Updated.");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <Field label="Telegram ID" value={telegramId} onChange={setTelegramId} />
      <button onClick={lookup} className="w-full py-2.5 rounded-xl border border-white/10 text-sm font-semibold">Look up</button>

      {found && (
        <div className="text-sm space-y-1 pt-2 border-t border-white/5">
          <p>@{found.username || "-"} — {found.firstName}</p>
          <p>💎 {found.diamonds} &nbsp; 💵 {found.usdt?.toFixed?.(4)}</p>
          <Field label="Adjust diamonds by (+/-)" value={delta} onChange={setDelta} type="number" />
          <button onClick={adjust} disabled={!delta} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-diamond to-accentPurple font-semibold disabled:opacity-40">
            Apply
          </button>
        </div>
      )}
      {status && <p className="text-xs text-gray-400">{status}</p>}
    </div>
  );
}

function EconomyPanel({ apiFetch }) {
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/settings").then(setSettings).catch(() => {});
  }, []);

  function update(path, value) {
    setSettings((s) => {
      const next = { ...s };
      if (path[0] === "adRewards") next.adRewards = { ...next.adRewards, [path[1]]: value };
      else next[path[0]] = value;
      return next;
    });
  }

  function toggleHidden(network) {
    setSettings((s) => {
      const hidden = new Set(s.hiddenAdNetworks || []);
      hidden.has(network) ? hidden.delete(network) : hidden.add(network);
      return { ...s, hiddenAdNetworks: [...hidden] };
    });
  }

  async function save() {
    setStatus("saving...");
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          diamondToUsdtRate: settings.diamondToUsdtRate,
          minWithdrawUsdt: settings.minWithdrawUsdt,
          withdrawCooldownMinutes: settings.withdrawCooldownMinutes,
          dailyAdCapPerNetwork: settings.dailyAdCapPerNetwork,
          adRewards: settings.adRewards,
          hiddenAdNetworks: settings.hiddenAdNetworks
        })
      });
      setSettings(res);
      setStatus("Saved.");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  }

  if (!settings) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="glass-card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-diamond mb-2">Conversion rate</h3>
        <Field label="1 Diamond = $ (USDT)" type="number" value={settings.diamondToUsdtRate} onChange={(v) => update(["diamondToUsdtRate"], Number(v))} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-diamond mb-2">Ad rewards</h3>
        <div className="space-y-2">
          {["adsgram", "monetag"].map((net) => {
            const hidden = (settings.hiddenAdNetworks || []).includes(net);
            return (
              <div key={net} className="flex items-center gap-2">
                <span className="text-sm w-20 capitalize">{net}</span>
                <input
                  type="number" value={settings.adRewards?.[net] ?? 0}
                  onChange={(e) => update(["adRewards", net], Number(e.target.value))}
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-diamond"
                />
                <button
                  onClick={() => toggleHidden(net)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium flex-shrink-0 ${hidden ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}
                >
                  {hidden ? "Hidden" : "Visible"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-1">Toggling "Hidden" removes that ad row from every user's Daily tab immediately.</p>
      </div>

      <Field label="Daily ad cap per network" type="number" value={settings.dailyAdCapPerNetwork} onChange={(v) => update(["dailyAdCapPerNetwork"], Number(v))} />
      <Field label="Minimum withdrawal (USDT)" type="number" value={settings.minWithdrawUsdt} onChange={(v) => update(["minWithdrawUsdt"], Number(v))} />
      <Field label="Withdrawal cooldown (minutes)" type="number" value={settings.withdrawCooldownMinutes} onChange={(v) => update(["withdrawCooldownMinutes"], Number(v))} />

      <button onClick={save} className="w-full py-3 rounded-xl bg-gradient-to-r from-diamond to-accentPurple font-semibold">
        Save Settings
      </button>
      {status && <p className="text-xs text-gray-400">{status}</p>}
    </div>
  );
}

function WithdrawalsPanel({ apiFetch }) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [status, setStatus] = useState(null);

  function load() {
    apiFetch("/api/admin/withdrawals?status=pending").then(setWithdrawals).catch(() => {});
  }
  useEffect(load, []);

  async function process(id, action) {
    setStatus("updating...");
    try {
      await apiFetch("/api/admin/withdrawals", { method: "POST", body: JSON.stringify({ id, action }) });
      setStatus(null);
      load();
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  }

  return (
    <div className="space-y-3">
      {withdrawals.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No pending withdrawals.</p>}
      {withdrawals.map((w) => (
        <div key={w._id} className="glass-card p-4">
          <div className="flex justify-between mb-1">
            <p className="text-sm font-medium">@{w.username || w.telegramId}</p>
            <p className="text-sm font-bold text-diamond">${w.amountUsdt.toFixed(4)}</p>
          </div>
          <p className="text-xs text-gray-400 break-all mb-3">{w.usdtAddress}</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => process(w._id, "paid")} className="py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-semibold">
              Mark Paid
            </button>
            <button onClick={() => process(w._id, "rejected")} className="py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold">
              Reject & Refund
            </button>
          </div>
        </div>
      ))}
      {status && <p className="text-xs text-gray-400">{status}</p>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", onBlur }) {
  return (
    <div>
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-diamond"
      />
    </div>
  );
}
