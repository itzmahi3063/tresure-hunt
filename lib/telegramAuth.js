import crypto from "crypto";

/**
 * Verifies Telegram WebApp "initData" per Telegram's official spec:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * This is the FIRST line of defense against people opening devtools/Postman/curl
 * and calling your API directly pretending to be a Telegram user. Every API route
 * that touches balance MUST call this and reject on failure.
 *
 * @param {string} initData - the raw initData string sent by the Telegram Mini App client
 * @returns {{ ok: boolean, user?: object, authDate?: number, reason?: string }}
 */
export function verifyTelegramInitData(initData) {
  if (!initData || typeof initData !== "string") {
    return { ok: false, reason: "missing_init_data" };
  }

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return { ok: false, reason: "server_misconfigured" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "missing_hash" };
  params.delete("hash");

  // Build the data-check-string: sorted key=value pairs joined by \n
  const dataCheckArr = [];
  for (const [key, value] of [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    dataCheckArr.push(`${key}=${value}`);
  }
  const dataCheckString = dataCheckArr.join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) {
    return { ok: false, reason: "bad_signature" };
  }

  // Reject stale sessions (protects against replaying an old captured initData)
  const authDate = Number(params.get("auth_date"));
  const MAX_AGE_SECONDS = 60 * 60 * 6; // 6 hours
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) {
    return { ok: false, reason: "expired" };
  }

  let user;
  try {
    user = JSON.parse(params.get("user"));
  } catch {
    return { ok: false, reason: "bad_user_payload" };
  }

  return { ok: true, user, authDate };
}

/**
 * Helper for API routes: pulls initData out of the Authorization header,
 * verifies it, and returns the Telegram user or throws a 401-style error object.
 */
export function requireTelegramUser(req) {
  const authHeader = req.headers.get?.("authorization") || req.headers.authorization;
  const initData = authHeader?.startsWith("tma ") ? authHeader.slice(4) : null;
  const result = verifyTelegramInitData(initData);
  if (!result.ok) {
    const err = new Error("Unauthorized: " + result.reason);
    err.status = 401;
    throw err;
  }
  return result.user;
}

export function isAdmin(telegramUser) {
  return String(telegramUser?.id) === String(process.env.ADMIN_TELEGRAM_ID);
}
