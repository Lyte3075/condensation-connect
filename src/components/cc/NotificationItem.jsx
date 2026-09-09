import React from "react";
import moment from "moment";
import { AtSign, UserPlus, UserCheck, Users, Shield } from "lucide-react";

const ICONS = {
  mention: AtSign,
  friend_request: UserPlus,
  friend_accept: UserCheck,
  server_alert: Users,
};

const COLORS = {
  mention: "#06b6d4",
  friend_request: "#10b981",
  friend_accept: "#22c55e",
  server_alert: "#f59e0b",
};

export default function NotificationItem({ n, onClick }) {
  const Icon = ICONS[n.type] || Users;
  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl border transition-colors ${
        n.read
          ? "bg-[var(--cc-surface)] border-[var(--cc-border)]"
          : "bg-[var(--cc-surface)] border-[var(--cc-accent)]"
      }`}
    >
      {n.actor_avatar ? (
        <img src={n.actor_avatar} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${COLORS[n.type] || "#8b5cf6"}22`, color: COLORS[n.type] || "#8b5cf6" }}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--cc-text)] truncate">{n.title}</span>
          {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--cc-accent)] flex-shrink-0" />}
        </div>
        {n.body && <p className="text-xs text-[var(--cc-muted)] mt-0.5 line-clamp-2">{n.body}</p>}
        <div className="text-[11px] text-[var(--cc-muted)] mt-1">{moment(n.created_date).fromNow()}</div>
      </div>
    </button>
  );
}