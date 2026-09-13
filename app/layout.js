import "./globals.css";

export const metadata = {
  title: "Treasure Hunt",
  description: "Farm diamonds, complete tasks, and unlock real rewards."
};

export default function RootLayout({ children }) {
  const monetagZone = process.env.NEXT_PUBLIC_MONETAG_ZONE_ID;
  return (
    <html lang="en">
      <head>
        {/* Official Telegram Mini App SDK — gives us initData, theme params, haptics, MainButton, etc. */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        {/* Adsgram rewarded-ad SDK */}
        <script src="https://sad.adsgram.ai/js/sad.min.js"></script>
        {/* Monetag rewarded-ad SDK — data-sdk name must match the zone ID you were issued */}
        {monetagZone && (
          <script src="//libtl.com/sdk.js" data-zone={monetagZone} data-sdk={`show_${monetagZone}`}></script>
        )}
      </head>
      <body className="font-body max-w-md mx-auto min-h-screen pb-24">
        {children}
      </body>
    </html>
  );
}
