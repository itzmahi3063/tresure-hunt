"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/lib/useTelegram";

export default function WalletModal({ profile, onClose, onUpdate }) {
  const { apiFetch } = useTelegram();
  const [tab, setTab] = useState("withdraw");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [convertAmount, setConvertAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [rate, setRate] = useState(0.00004); // refreshed from the server below; this is just the initial paint

  useEffect(() => {
    apiFetch("/api/settings/public").then((s) => setRate(s.diamondToUsdtRate)).catch(() => {});
  }, []);

  async function handleWithdraw() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await apiFetch("/api/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({ amountUsdt: Number(amount), usdtAddress: address })
      });
      onUpdate((p) => ({ ...p, usdt: result.usdt }));
      setMessage({ type: "success", text: "Withdrawal request submitted!" });
      setAmount("");
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleConvert() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await apiFetch("/api/wallet/convert", {
        method: "POST",
        body: JSON.stringify({ diamondAmount: Number(convertAmount) })
      });
      onUpdate((p) => ({ ...p, diamonds: result.diamonds, usdt: result.usdt }));
      setMessage({ type: "success", text: `Converted to $${result.converted.toFixed(4)} USDT` });
      setConvertAmount("");
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="glass-card w-full p-5 rounded-b-none max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Wallet</h3>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">×</button>
        </div>

        <div className="diamond-pill flex p-1 mb-4">
          <button onClick={() => setTab("withdraw")} className={`flex-1 py-2 rounded-xl text-sm font-medium ${tab === "withdraw" ? "bg-diamond/20 text-diamond" : "text-gray-400"}`}>Withdraw</button>
          <button onClick={() => setTab("convert")} className={`flex-1 py-2 rounded-xl text-sm font-medium ${tab === "convert" ? "bg-diamond/20 text-diamond" : "text-gray-400"}`}>Convert</button>
        </div>

        {tab === "withdraw" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">Withdraw your USDT balance. Payouts only — USDT (TRC20) supported.</p>
            <div>
              <label className="text-xs text-gray-400">Amount (USDT)</label>
              <input
                type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-diamond"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">USDT (TRC20) Address</label>
              <input
                value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="T..." className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-diamond"
              />
            </div>
            <p className="text-xs text-gray-500">Available: {(profile?.usdt ?? 0).toFixed(4)} USDT</p>
            <button
              onClick={handleWithdraw} disabled={busy || !amount || !address}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-diamond to-accentPurple font-semibold disabled:opacity-40"
            >
              {busy ? "Processing..." : "Request Withdrawal"}
            </button>
          </div>
        )}

        {tab === "convert" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Convert diamonds to USDT. 1 💎 = ${rate.toFixed(5)}
            </p>
            <div>
              <label className="text-xs text-gray-400">Diamonds to convert</label>
              <input
                type="number" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)}
                placeholder="0" className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-diamond"
              />
            </div>
            <p className="text-xs text-gray-500">
              Available: {(profile?.diamonds ?? 0).toLocaleString()} 💎
              {convertAmount ? ` → ≈ $${(Number(convertAmount) * rate).toFixed(4)}` : ""}
            </p>
            <button
              onClick={handleConvert} disabled={busy || !convertAmount}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-diamond to-accentPurple font-semibold disabled:opacity-40"
            >
              {busy ? "Processing..." : "Convert to USDT"}
            </button>
          </div>
        )}

        {message && (
          <p className={`text-xs mt-3 text-center ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
