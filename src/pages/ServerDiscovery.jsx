import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAppearance } from "@/lib/useAppearance";
import { getMyProfile, createNotification } from "@/lib/ccUtils";
import PageShell from "@/components/cc/PageShell";
import { Search, Globe, Users } from "lucide-react";

export default function ServerDiscovery() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [servers, setServers] = useState(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  useAppearance(profile);

  const refresh = useCallback(async () => {
    const all = await base44.entities.Server.filter({ is_public: true }, "-created_date", 200);
    setServers(all);
  }, []);

  useEffect(() => {
    if (!user) return;
    getMyProfile(user).then(setProfile);
    refresh();
    const unsub = base44.entities.Server.subscribe(() => refresh());
    return () => unsub && unsub();
  }, [user, refresh]);

  const join = async (s) => {
    setBusyId(s.id);
    try {
      await base44.entities.Server.update(s.id, {
        member_ids: [...new Set([...(s.member_ids || []), user.id])],
      });
      if (s.owner_id && s.owner_id !== user.id) {
        await createNotification({
          user_id: s.owner_id,
          type: "server_alert",
          actor_username: profile?.username || "Someone",
          title: "New server member",
          body: `@${profile?.username || "Someone"} joined ${s.name}`,
          server_id: s.id,
        });
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const leave = async (s) => {
    setBusyId(s.id);
    try {
      await base44.entities.Server.update(s.id, {
        member_ids: (s.member_ids || []).filter((id) => id !== user.id),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const filtered = (servers || []).filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <PageShell title="Server discovery" subtitle="Browse public servers">
      <div className="flex items-center gap-2 bg-[var(--cc-input)] rounded-xl px-3 py-2 border border-[var(--cc-border)] focus-within:border-[var(--cc-accent)] mb-4">
        <Search className="w-4 h-4 text-[var(--cc-muted)] shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search servers"
          className="flex-1 bg-transparent outline-none text-sm placeholder-[var(--cc-muted)]"
        />
      </div>

      {servers === null ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-[var(--cc-border)] border-t-[var(--cc-accent)] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Globe className="w-10 h-10 text-[var(--cc-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--cc-muted)]">
            {query ? "No servers match your search." : "No public servers yet. Create one from the app and check “Public server” to list it here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const joined = s.member_ids?.includes(user.id);
            return (
              <div
                key={s.id}
                className="rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-4 flex items-center gap-3"
              >
                {s.icon_url ? (
                  <img src={s.icon_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--cc-accent)] text-black font-bold flex items-center justify-center shrink-0">
                    {(s.name || "S").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.name}</div>
                  {s.description && (
                    <p className="text-xs text-[var(--cc-muted)] line-clamp-2">{s.description}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-[var(--cc-muted)] mt-1">
                    <Users className="w-3 h-3" />
                    {(s.member_ids?.length || 1)} member{(s.member_ids?.length || 1) === 1 ? "" : "s"}
                  </div>
                </div>
                <button
                  onClick={() => (joined ? leave(s) : join(s))}
                  disabled={busyId === s.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium shrink-0 disabled:opacity-60 ${
                    joined
                      ? "bg-[var(--cc-surface)] border border-[var(--cc-border)] text-[var(--cc-muted)]"
                      : "bg-[var(--cc-accent)] text-black"
                  }`}
                >
                  {busyId === s.id ? "…" : joined ? "Leave" : "Join"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}