# Treasure Hunt — Telegram Mini App

A diamond-earning Telegram Mini App: tasks (Daily/Social/Exclusive/Partner), a chest
you open with keys, a referral program with lifetime withdrawal commission, and a
wallet (Withdraw USDT / Convert diamonds → USDT). Fully admin-controlled economy.

## 1. Prerequisites

- Node.js 18+
- A Telegram bot from [@BotFather](https://t.me/BotFather) — get the token, and
  set the Mini App URL with `/newapp` (or `/setmenubutton`) once you've deployed.
- A MongoDB Atlas cluster (free tier is fine to start).
- A [Vercel](https://vercel.com) account for hosting the web app.
- Accounts with your chosen ad networks (Adsgram, Monetag) for their block/zone IDs.

## 2. Local setup

```bash
npm install
cp .env.example .env
# fill in every value in .env — see comments in that file
npm run dev        # web app on http://localhost:3000
npm run bot        # in a second terminal — the Telegram bot (long polling)
```

The web app only renders correctly inside Telegram (it depends on
`window.Telegram.WebApp`), so test it by opening your bot in Telegram and
tapping the "Open Treasure Hunt" button it sends on `/start`. For quick UI
iteration you can still load it in a normal browser tab, but any button that
calls the API will fail (by design — see Security below).

## 3. Deploying

1. Push this repo to GitHub.
2. Import it into Vercel, add every variable from `.env` as a Vercel
   Environment Variable, and deploy.
3. Set `NEXT_PUBLIC_APP_URL` to the resulting `https://your-app.vercel.app` URL
   and redeploy (env var changes need a redeploy to take effect).
4. Run the bot process (`npm run bot`) on a small always-on host — **not**
   Vercel, since Vercel's serverless functions don't stay alive for long
   polling. Railway, Render, or a cheap VPS all work well for this one file.
5. Message your bot with `/start` to get the Mini App button, and `/admin`
   (from your own account only) to get the Admin Panel button.

## 4. How the admin gate works

There's no separate password. `ADMIN_TELEGRAM_ID` in your env is the only
identity that can ever see `/admin` respond in the bot, or get anything but a
blank page from the `/admin` route or any `/api/admin/*` endpoint — every one
of those routes re-verifies the request's Telegram signature server-side and
checks the numeric ID against `ADMIN_TELEGRAM_ID`. Non-admins get a generic
403/blank page, not an error that reveals an admin panel exists.

## 5. Security model (read this before launching)

This app moves real money (USDT), so a few things are load-bearing:

- **Every API route re-verifies Telegram's `initData` HMAC signature**
  (`lib/telegramAuth.js`), per Telegram's own spec. A user opening devtools
  and calling your API directly with a forged `Authorization` header gets
  rejected — the signature can only be produced by Telegram itself, using
  your bot token as the secret.
- **The client never sends amounts.** Every reward endpoint (`chest/open`,
  `tasks/complete`, referral bonuses) looks up the amount from MongoDB
  server-side. Editing a request body in devtools can at most swap which
  *valid* task you're claiming — it can never inject an arbitrary number.
- **Channel/group "join" tasks are verified for real** via Telegram's
  `getChatMember` API — the bot must be an admin in the target chat. Claiming
  the task without actually joining fails the check.
- **Ad-watch tasks** are only credited after enough wall-clock time has
  passed for a full ad view (`lib/security.js#isPlausibleAdWatch`), so
  firing the completion call in a loop from devtools without watching
  anything gets rejected. Wire your ad SDK's real reward callback into
  `watchAd()` in `app/task/page.js` — the 15s `setTimeout` there is a
  placeholder until you drop in Adsgram/Monetag's actual show-ad promise.
- **Rate limiting** on every balance-changing route (`lib/security.js`)
  stops rapid-fire farming even with a valid signature.
- **Withdrawals** enforce a minimum amount and a cooldown, both admin-editable
  in `Settings`.

None of this makes fraud *impossible* — no client-facing app can be 100%
airtight — but it removes the easy wins (devtools balance editing, fake task
completions, ad-farming bots) that this kind of app usually gets hit with.
Two things worth adding before a real launch:

- A `PendingWithdrawal` collection + manual/automated payout queue, instead
  of instantly decrementing balance and hoping you remember to pay it out
  (there's a `TODO` marking exactly where to add this in
  `app/api/wallet/withdraw/route.js`).
- Move `lib/security.js`'s in-memory rate limiter to Redis (e.g. Upstash) once
  you're running more than one server instance — an in-memory Map only limits
  requests hitting the *same* instance.

## 6. What's stubbed / left for you

- **Ad SDK credentials** — `app/layout.js` loads both SDK scripts, and
  `lib/adSdk.js` calls the real Adsgram/Monetag show-ad APIs. Just fill in
  `NEXT_PUBLIC_ADSGRAM_BLOCK_ID` and `NEXT_PUBLIC_MONETAG_ZONE_ID` once you
  have them — the Daily tab's "Watch & Earn" cards (`/api/ads`,
  `/api/ads/complete`) are fully wired to real rewards, daily caps, and the
  values you set in Admin → Economy.
- **Games (`/play`)** — intentionally left as a placeholder per your request;
  drop your game components in `app/play/page.js` when ready.
- **Chest reward table** — the odds/amounts in
  `app/api/chest/open/route.js#rollChestReward` are placeholders; tune them
  to your economy.
- **Referral milestone tracking** — `referralCount` increments on `/start`;
  wiring the specific "friend completed 5 tasks" / "friend watched 20 ads"
  milestone bonuses into `User.dailyProgress` / `completedTaskIds` is the
  next piece to build once task volume is real.
- **VIP tier logic** — the `Daily` tab's old "Free VIP for watching N ads"
  banner was intentionally removed per your spec; the `User.vipTier` /
  `Settings.vipUnlockAdsRequired` fields are there if you want to reintroduce
  a VIP mechanic later.

## 7. Admin panel tabs

- **Broadcast** — send a message to every non-banned user via the bot.
- **Add Task** — publish a task to Daily/Social/Exclusive/Partner; for
  Channel/Group tasks it checks live whether your bot is an admin there
  (required for join verification to work) before you publish.
- **User Balance** — look up any user by Telegram ID and manually adjust
  their diamond balance (refunds, corrections, promos).
- **Economy** — live-editable: the diamond→USDT rate, Adsgram/Monetag reward
  amounts and per-network daily watch cap, a per-network Hidden/Visible
  toggle (hides that ad row from every user's Daily tab immediately), the
  minimum withdrawal, and the withdrawal cooldown. Changes apply the moment
  you hit Save — no redeploy needed.
- **Withdrawals** — every withdrawal request lands here as `pending`
  (`PendingWithdrawal` collection). "Mark Paid" is for once you've sent the
  USDT yourself; "Reject & Refund" gives the diamonds/USDT back to the user
  automatically. Nothing pays out on-chain automatically — this is a queue
  for you (or a payout bot you build later) to process.

## 8. Diamond value

`Settings.diamondToUsdtRate` defaults to **0.00004** (matches your spec) and
is shown to users in the Convert tab and on the Refer page — pulled live from
`/api/settings/public` so it always matches whatever you last set in
Admin → Economy.
