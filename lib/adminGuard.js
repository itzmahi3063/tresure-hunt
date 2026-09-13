import { requireTelegramUser, isAdmin } from "@/lib/telegramAuth";

/**
 * Every /api/admin/* route calls this first. It verifies the Telegram
 * signature (same as any user route) AND checks the numeric Telegram ID
 * against ADMIN_TELEGRAM_ID from env. There is no separate "admin password" —
 * the identity check IS the gate, so it can't be phished or guessed.
 */
export function requireAdmin(req) {
  const user = requireTelegramUser(req);
  if (!isAdmin(user)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return user;
}
