"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/task", label: "Task", icon: TaskIcon },
  { href: "/play", label: "Play", icon: PlayIcon },
  { href: "/refer", label: "Refer", icon: ReferIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40">
      <div className="mx-3 mb-3 glass-card shadow-glow flex justify-between px-2 py-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 rounded-2xl transition-all ${
                active ? "nav-btn-active bg-white/5" : "text-gray-400"
              }`}
            >
              <Icon active={active} />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 11l9-7 9 7v8a2 2 0 01-2 2h-4a1 1 0 01-1-1v-5H9v5a1 1 0 01-1 1H4a2 2 0 01-2-2v-8z"
        fill={active ? "#4fd6ff" : "none"} stroke={active ? "#4fd6ff" : "#8b8ba7"} strokeWidth="1.6" />
    </svg>
  );
}
function TaskIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={active ? "#4fd6ff" : "#8b8ba7"} strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke={active ? "#4fd6ff" : "#8b8ba7"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function PlayIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? "#4fd6ff" : "#8b8ba7"} strokeWidth="1.6" />
      <path d="M10 8l6 4-6 4V8z" fill={active ? "#4fd6ff" : "#8b8ba7"} />
    </svg>
  );
}
function ReferIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="8" r="3" stroke={active ? "#4fd6ff" : "#8b8ba7"} strokeWidth="1.6" />
      <circle cx="16" cy="13" r="3" stroke={active ? "#4fd6ff" : "#8b8ba7"} strokeWidth="1.6" />
      <path d="M3 20c0-2.8 2.2-5 5-5s5 2.2 5 5M11 20c0-2 1.8-4.5 5-4.5s5 2.5 5 4.5"
        stroke={active ? "#4fd6ff" : "#8b8ba7"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={active ? "#4fd6ff" : "#8b8ba7"} strokeWidth="1.6" />
      <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" stroke={active ? "#4fd6ff" : "#8b8ba7"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
