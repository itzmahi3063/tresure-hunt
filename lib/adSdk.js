"use client";

/**
 * Thin wrapper around each ad network's rewarded-ad SDK so the rest of the
 * app can just call `showAd("adsgram")` / `showAd("monetag")` and get a
 * promise that resolves only when the ad actually finished playing.
 *
 * Both SDK <script> tags are loaded once from app/layout.js. If a network's
 * env var isn't set yet, showAd() rejects immediately instead of pretending
 * to succeed — so you can't accidentally ship a "free reward, no ad" bug
 * just because a block ID was left blank.
 */

let adsgramInstance = null;

function getAdsgram() {
  const blockId = process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID;
  if (!blockId) return null;
  if (!window.Adsgram) return null;
  if (!adsgramInstance) {
    adsgramInstance = window.Adsgram.init({ blockId });
  }
  return adsgramInstance;
}

function showAdsgram() {
  const controller = getAdsgram();
  if (!controller) return Promise.reject(new Error("Adsgram isn't configured yet"));
  // Adsgram's .show() resolves on a completed/rewarded view and rejects if
  // the user closes early or no fill is available — exactly the signal we want.
  return controller.show();
}

function showMonetag() {
  const zoneId = process.env.NEXT_PUBLIC_MONETAG_ZONE_ID;
  if (!zoneId) return Promise.reject(new Error("Monetag isn't configured yet"));
  const fnName = `show_${zoneId}`;
  if (typeof window[fnName] !== "function") {
    return Promise.reject(new Error("Monetag SDK not loaded"));
  }
  // Monetag's in-app-interstitial function returns a promise that resolves
  // once the ad has been shown/dismissed.
  return window[fnName]();
}

export function showAd(network) {
  if (network === "adsgram") return showAdsgram();
  if (network === "monetag") return showMonetag();
  return Promise.reject(new Error("Unknown ad network"));
}
