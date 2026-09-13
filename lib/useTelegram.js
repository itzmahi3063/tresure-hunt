"use client";

import { useEffect, useState } from "react";

/**
 * Client-side hook that grabs the Telegram Mini App context. Because the app
 * can ONLY be opened inside Telegram (see the middleware note in README),
 * window.Telegram.WebApp.initData is always present for real users. Anyone
 * trying to open the URL directly in a normal browser tab has no initData,
 * so every authenticated API call below fails closed instead of trusting them.
 */
export function useTelegram() {
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webApp.ready();
      webApp.expand();
      setTg(webApp);
      setUser(webApp.initDataUnsafe?.user || null);
    }
    setReady(true);
  }, []);

  /**
   * Authenticated fetch — attaches raw initData as a bearer-style token.
   * The server re-verifies the HMAC signature on every single call; it never
   * trusts initDataUnsafe (client-parsed, spoofable) for anything that touches balance.
   */
  async function apiFetch(url, options = {}) {
    const initData = window.Telegram?.WebApp?.initData || "";
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `tma ${initData}`,
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }
    return res.json();
  }

  return { tg, user, ready, apiFetch };
}
