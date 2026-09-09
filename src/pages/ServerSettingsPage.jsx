import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAppearance } from "@/lib/useAppearance";
import { getMyProfile } from "@/lib/ccUtils";
import PageShell from "@/components/cc/PageShell";
import ServerMemberRow from "@/components/cc/ServerMemberRow";
import { Upload, Save, ChevronRight, Globe, Users, ShieldAlert } from "lucide-react";

export default function ServerSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [server, setServer] = useState(undefined);
  const [members, setMembers] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const fileRef = useRef(null);
  useAppearance(profile);

  const serverId = new URLSearchParams(window.location.search).get("server");

  const load = useCallback(async () => {
    const s = (await base44.entities.Server.filter({ id: serverId }, "-created_date", 1))[0];
    setServer(s || null);
    if (!s) return;
    const ids = [...new Set([...(s.member_ids || []), s.owner_id])];
    const profiles = await base44.entities.Profile.list("-created_date", 500);
    setMembers(profiles.filter((p) => ids.includes(p.user_id)));
  }, [serverId]);

  useEffect(() => {
    if (!user) return;
    getMyProfile(user).then(setProfile);
    if (serverId) load();
    else setServer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, serverId]);

  useEffect(() => {
    if (server) {
      setName(server.name || "");
      setDescription(server.description || "");
      setIcon(server.icon_url || "");
    }
  }, [server?.id]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setIcon(file_url);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSavedAt(null);
    try {
      const updated = await base44.entities.Server.update(server.id, {
        name: name.trim(),
        description: description.trim(),
        icon_url: icon,
      });
      setServer((prev) => ({ ...prev, ...updated }));
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  const applyUpdate = (updated) => {
    setServer((prev) => ({ ...prev, ...updated }));
  };

  const toggleAdmin = async (memberId) => {
    setBusyId(memberId);
    try {
      const admins = server.admin_ids || [];
      const next = admins.includes(memberId) ? admins.filter((id) => id !== memberId) : [...admins, memberId];
      const updated = await base44.entities.Server.update(server.id, { admin_ids: next });
      applyUpdate(updated);
    } finally {
      setBusyId(null);
    }
  };

  const toggleModerator = async (memberId) => {
    setBusyId(memberId);
    try {
      const mods = server.moderator_ids || [];
      const next = mods.includes(memberId) ? mods.filter((id) => id !== memberId) : [...mods, memberId];
      const updated = await base44.entities.Server.update(server.id, { moderator_ids: next });
      applyUpdate(updated);
    } finally {
      setBusyId(null);
    }
  };

  const kick = async (memberId) => {
    setBusyId(memberId);
    try {
      const updated = await base44.entities.Server.update(server.id, {
        member_ids: (server.member_ids || []).filter((id) => id !== memberId),
        admin_ids: (server.admin_ids || []).filter((id) => id !== memberId),
        moderator_ids: (server.moderator_ids || []).filter((id) => id !== memberId),
      });
      applyUpdate(updated);
      setMembers((prev) => prev.filter((m) => m.user_id !== memberId));
    } finally {
      setBusyId(null);
    }
  };

  // No server selected: let the owner pick one of their servers
  if (!serverId) {
    return <ServerPicker user={user} />;
  }

  if (server === undefined) {
    return (
      <PageShell title="Server management" subtitle="Update your server">
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-[var(--cc-border)] border-t-[var(--cc-accent)] rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!server) {
    return (
      <PageShell title="Server management" subtitle="Update your server">
        <p className="text-sm text-[var(--cc-muted)] text-center py-16">That server doesn't exist.</p>
      </PageShell>
    );
  }

  if (server.owner_id !== user.id) {
    return (
      <PageShell title="Server management" subtitle={server.name}>
        <div className="text-center py-16">
          <ShieldAlert className="w-10 h-10 text-[var(--cc-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--cc-muted)]">Only the server owner can manage this server.</p>
        </div>
      </PageShell>
    );
  }

  const admins = server.admin_ids || [];
  const moderators = server.moderator_ids || [];

  return (
    <PageShell title="Server management" subtitle={server.name}>
      <div className="space-y-6">
        {/* Icon */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--cc-accent)] text-black flex items-center justify-center font-bold text-xl flex-shrink-0">
            {icon ? (
              <img src={icon} className="w-full h-full object-cover" alt="" />
            ) : (
              (name || "?").slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[var(--cc-accent)] text-black text-sm font-medium flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Change icon
            </button>
            <p className="text-xs text-[var(--cc-muted)] mt-1.5">Shown in the server rail and discovery.</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
        </div>

        {/* Name + description */}
        <div className="space-y-4 p-4 rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)]">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
              Server Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)] resize-none"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--cc-muted)]">
            <Globe className="w-4 h-4" />
            {server.is_public ? "Listed publicly in server discovery" : "Private server — invite only"}
          </div>
          <div className="flex items-center justify-end gap-3">
            {savedAt && <span className="text-xs text-[var(--cc-accent)]">Saved</span>}
            <button
              onClick={save}
              disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--cc-accent)] text-black font-medium text-sm disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        {/* Members & permissions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--cc-text)]">Members & permissions</h3>
            <span className="text-xs text-[var(--cc-muted)] flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {members.length}
            </span>
          </div>
          <div className="space-y-2">
            {members.length === 0 && (
              <p className="text-xs text-[var(--cc-muted)] text-center py-6">No members yet.</p>
            )}
            {members.map((m) => {
              const role =
                m.user_id === server.owner_id
                  ? "owner"
                  : admins.includes(m.user_id)
                    ? "admin"
                    : moderators.includes(m.user_id)
                      ? "moderator"
                      : "member";
              return (
                <ServerMemberRow
                  key={m.user_id}
                  member={m}
                  role={role}
                  canManage={m.user_id !== user.id}
                  busy={busyId === m.user_id}
                  onToggleAdmin={() => toggleAdmin(m.user_id)}
                  onToggleModerator={() => toggleModerator(m.user_id)}
                  onKick={() => kick(m.user_id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function ServerPicker({ user }) {
  const [owned, setOwned] = useState(null);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const all = await base44.entities.Server.list("-created_date", 200);
      setOwned(all.filter((s) => s.owner_id === user.id));
    })();
  }, [user]);

  return (
    <PageShell title="Server management" subtitle="Pick one of your servers to manage">
      {owned === null ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-[var(--cc-border)] border-t-[var(--cc-accent)] rounded-full animate-spin" />
        </div>
      ) : owned.length === 0 ? (
        <p className="text-sm text-[var(--cc-muted)] text-center py-16">
          You don't own any servers yet. Create one with the + button in the app.
        </p>
      ) : (
        <div className="space-y-2">
          {owned.map((s) => (
            <Link
              key={s.id}
              to={`/server-settings?server=${s.id}`}
              className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] hover:border-[var(--cc-accent)]"
            >
              {s.icon_url ? (
                <img src={s.icon_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[var(--cc-accent)] text-black font-bold flex items-center justify-center">
                  {(s.name || "S").slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="flex-1 min-w-0 text-sm font-medium text-[var(--cc-text)] truncate">{s.name}</span>
              <ChevronRight className="w-4 h-4 text-[var(--cc-muted)]" />
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}