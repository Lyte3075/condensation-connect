import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Users, Bell, Settings } from "lucide-react";

const TABS = [
  { to: "/channels/dm", label: "DMs", Icon: MessageCircle },
  { to: "/friend-list", label: "Friends", Icon: Users },
  { to: "/notifications", label: "Alerts", Icon: Bell },
  { to: "/account-settings", label: "Settings", Icon: Settings },
];

export default function BottomTabs() {
  const { pathname } = useLocation();
  const active = (to) =>
    to === "/channels/dm"
      ? pathname === "/" || pathname.startsWith("/channels/dm")
      : pathname.startsWith(to);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--cc-surface,#1a1a1a)] border-t border-[var(--cc-border,#2a2a2a)] cc-safe-bottom cc-tabbar flex">
      {TABS.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-14 ${
            active(to)
              ? "text-[var(--cc-accent,#CCFF00)]"
              : "text-[var(--cc-muted,#a0a0a0)]"
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </Link>
      ))}
    </nav>
  );
}