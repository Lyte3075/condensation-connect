import React from "react";
import { Crown, Shield, Wrench, UserX } from "lucide-react";

const ROLE_BADGES = {
  owner: { label: "Owner", Icon: Crown, cls: "bg-[var(--cc-accent)] text-black" },
  admin: { label: "Admin", Icon: Shield, cls: "bg-[var(--cc-hover)] text-[var(--cc-accent)]" },
  moderator: { label: "Mod", Icon: Wrench, cls: "bg-[var(--cc-hover)] text-[var(--cc-muted)]" },
};

export default function ServerMemberRow({ member, role, canManage, busy, onToggleAdmin, onToggleModerator, onKick }) {
  const isOwner = role === "owner";
  const badge = ROLE_BADGES[role];
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)]">
      {member.avatar_url ? (
        <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-[var(--cc-accent)] text-black font-bold flex items-center justify-center flex-shrink-0">
          {(member.display_name || member.username || "?")[0]?.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--cc-text)] truncate">
          {member.display_name || member.username}
        </div>
        <div className="text-xs text-[var(--cc-muted)] truncate">@{member.username}</div>
      </div>
      {badge && (
        <span
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${badge.cls}`}
        >
          <badge.Icon className="w-3 h-3" /> {badge.label}
        </span>
      )}
      {canManage && !isOwner && (
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          <button
            onClick={onToggleAdmin}
            disabled={busy}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--cc-hover)] text-[var(--cc-text)] text-xs font-medium hover:bg-[var(--cc-border)] disabled:opacity-50"
          >
            {role === "admin" ? "Remove admin" : "Make admin"}
          </button>
          <button
            onClick={onToggleModerator}
            disabled={busy}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--cc-hover)] text-[var(--cc-text)] text-xs font-medium hover:bg-[var(--cc-border)] disabled:opacity-50"
          >
            {role === "moderator" ? "Remove mod" : "Make mod"}
          </button>
          <button
            onClick={onKick}
            disabled={busy}
            title="Kick member"
            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}