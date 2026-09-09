import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  online: "#22c55e",
  idle: "#eab308",
  dnd: "#ef4444",
  invisible: "#6b7280",
};

const ROLE_PILLS = {
  owner: "bg-[var(--cc-accent)] text-black",
  admin: "bg-[var(--cc-hover)] text-[var(--cc-accent)]",
  moderator: "bg-[var(--cc-hover)] text-[var(--cc-muted)]",
};
const ROLE_LABELS = { owner: "Owner", admin: "Admin", moderator: "Mod" };

function MemberRow({ profile, role, onOpen }) {
  const name = profile.display_name || profile.username;
  const status = profile.status || "online";
  const dimmed = status === "invisible";
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[var(--cc-hover)] text-left"
      title="View profile"
    >
      <div className="relative shrink-0">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--cc-accent)] text-black font-bold text-sm flex items-center justify-center">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--cc-sidebar)]"
          style={{ backgroundColor: STATUS_COLORS[status] || STATUS_COLORS.online }}
        />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className={`text-sm truncate ${dimmed ? "text-[var(--cc-muted)]" : "text-[var(--cc-text)]"}`}>{name}</span>
        {role && (
          <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_PILLS[role]}`}>
            {ROLE_LABELS[role]}
          </span>
        )}
      </div>
    </button>
  );
}

export default function MemberList({ memberIds, server, onClose }) {
  const [profiles, setProfiles] = useState(null);
  const navigate = useNavigate();
  const idsKey = (memberIds || []).join(",");

  const roleOf = (uid) => {
    if (!server) return null;
    if (uid === server.owner_id) return "owner";
    if ((server.admin_ids || []).includes(uid)) return "admin";
    if ((server.moderator_ids || []).includes(uid)) return "moderator";
    return null;
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      const all = await base44.entities.Profile.list("-created_date", 200);
      if (!active) return;
      const ids = new Set(idsKey ? idsKey.split(",") : []);
      setProfiles(all.filter((p) => ids.has(p.user_id)));
    };
    load();
    const unsub = base44.entities.Profile.subscribe(() => {
      if (active) load();
    });
    return () => {
      active = false;
      unsub && unsub();
    };
  }, [idsKey]);

  const online = (profiles || []).filter((p) => (p.status || "online") !== "invisible");
  const offline = (profiles || []).filter((p) => p.status === "invisible");

  return (
    <div className="absolute inset-0 md:static md:inset-auto z-20 md:z-auto w-full md:w-60 shrink-0 flex flex-col border-l border-[var(--cc-border)] bg-[var(--cc-sidebar)]">
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--cc-border)]">
        <span className="text-xs font-semibold text-[var(--cc-muted)] uppercase tracking-wide">Members</span>
        <button onClick={onClose} className="md:hidden p-1 text-[var(--cc-muted)] hover:text-[var(--cc-text)]" title="Close member list">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {profiles === null ? (
          <div className="text-center text-xs text-[var(--cc-muted)] py-4">Loading members…</div>
        ) : (
          <>
            {online.length > 0 && (
              <div className="px-3 pt-1 pb-1 text-[11px] font-semibold text-[var(--cc-muted)] uppercase">
                Online — {online.length}
              </div>
            )}
            {online.map((p) => (
              <MemberRow
                key={p.id}
                profile={p}
                role={roleOf(p.user_id)}
                onOpen={() => navigate(`/user-profile?id=${p.id}`)}
              />
            ))}
            {offline.length > 0 && (
              <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-[var(--cc-muted)] uppercase">
                Offline — {offline.length}
              </div>
            )}
            {offline.map((p) => (
              <MemberRow
                key={p.id}
                profile={p}
                role={roleOf(p.user_id)}
                onOpen={() => navigate(`/user-profile?id=${p.id}`)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}