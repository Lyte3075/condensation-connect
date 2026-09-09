import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAppearance } from "@/lib/useAppearance";
import { getMyProfile, loadFriendData } from "@/lib/ccUtils";
import PageShell from "@/components/cc/PageShell";
import { UserCheck, UserX, Check, X, Ban, Heart, Clock, ShieldOff } from "lucide-react";

const TABS = [
  { id: "friends", label: "Friends", Icon: Heart },
  { id: "pending", label: "Pending", Icon: Clock },
  { id: "blocked", label: "Blocked", Icon: ShieldOff },
];

function Avatar({ profile }) {
  const name = profile?.display_name || profile?.username || "?";
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[var(--cc-accent)] text-black font-bold text-sm flex items-center justify-center shrink-0">
      {name[0]?.toUpperCase()}
    </div>
  );
}

export default function FriendListPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [blockedProfiles, setBlockedProfiles] = useState([]);
  const [tab, setTab] = useState("friends");
  useAppearance(profile);

  const refresh = useCallback(async () => {
    const [me, fd] = await Promise.all([
      getMyProfile(user),
      loadFriendData(user),
    ]);
    setProfile(me);
    setData(fd);
    const ids = new Set(me.blocked_user_ids || []);
    if (ids.size) {
      const all = await base44.entities.Profile.list("-created_date", 200);
      setBlockedProfiles(all.filter((p) => ids.has(p.user_id)));
    } else {
      setBlockedProfiles([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    refresh();
    const unsub = base44.entities.Friendship.subscribe(() => refresh());
    return () => unsub && unsub();
  }, [user, refresh]);

  if (!user || !profile || !data) {
    return (
      <PageShell title="Friends">
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-[var(--cc-border)] border-t-[var(--cc-accent)] rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  const otherUser = (f) => (f.from_user_id === user.id ? f.to_user_id : f.from_user_id);
  const otherName = (f) => (f.from_user_id === user.id ? f.to_username : f.from_username);

  const respond = async (f, accept) => {
    if (accept) await base44.entities.Friendship.update(f.id, { status: "accepted" });
    else await base44.entities.Friendship.delete(f.id);
    await refresh();
  };

  const removeFriend = async (f) => {
    await base44.entities.Friendship.delete(f.id);
    await refresh();
  };

  const blockFriend = async (f) => {
    await base44.entities.Friendship.delete(f.id);
    await base44.entities.Profile.update(profile.id, {
      blocked_user_ids: [...new Set([...(profile.blocked_user_ids || []), otherUser(f)])],
    });
    await refresh();
  };

  const unblock = async (p) => {
    await base44.entities.Profile.update(profile.id, {
      blocked_user_ids: (profile.blocked_user_ids || []).filter((id) => id !== p.user_id),
    });
    await refresh();
  };

  const pendingCount = data.incoming.length + data.outgoing.length;

  return (
    <PageShell title="Friends" subtitle="Friends, requests, and blocked users">
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ${
              tab === t.id
                ? "bg-[var(--cc-accent)] text-black"
                : "bg-[var(--cc-surface)] border border-[var(--cc-border)] text-[var(--cc-muted)]"
            }`}
          >
            <t.Icon className="w-4 h-4" />
            {t.label}
            {t.id === "pending" && pendingCount > 0 && (
              <span className={`text-xs px-1.5 rounded-full ${tab === t.id ? "bg-black/20" : "bg-[var(--cc-accent)] text-black"}`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <div className="space-y-2">
          {data.friends.length === 0 && (
            <p className="text-sm text-[var(--cc-muted)] text-center py-12">No friends yet. Add someone from the app!</p>
          )}
          {data.friends.map((f) => (
            <div key={f.id} className="rounded-xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--cc-accent)] text-black font-bold flex items-center justify-center shrink-0">
                {(otherName(f) || "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{otherName(f)}</div>
                <div className="text-xs text-[var(--cc-muted)] flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Friends
                </div>
              </div>
              <button
                onClick={() => removeFriend(f)}
                title="Remove friend"
                className="p-2 text-[var(--cc-muted)] hover:text-[var(--cc-text)] hover:bg-[var(--cc-hover)] rounded-lg"
              >
                <UserX className="w-4 h-4" />
              </button>
              <button
                onClick={() => blockFriend(f)}
                title="Block"
                className="p-2 text-[var(--cc-muted)] hover:text-red-400 hover:bg-[var(--cc-hover)] rounded-lg"
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "pending" && (
        <div className="space-y-2">
          {pendingCount === 0 && (
            <p className="text-sm text-[var(--cc-muted)] text-center py-12">No pending requests.</p>
          )}
          {data.incoming.map((f) => (
            <div key={f.id} className="rounded-xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--cc-accent)] text-black font-bold flex items-center justify-center shrink-0">
                {(f.from_username || "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.from_username}</div>
                <div className="text-xs text-[var(--cc-muted)]">wants to be friends</div>
              </div>
              <button
                onClick={() => respond(f, true)}
                title="Accept"
                className="p-2 bg-[var(--cc-accent)] text-black rounded-lg"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => respond(f, false)}
                title="Decline"
                className="p-2 text-[var(--cc-muted)] hover:text-red-400 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {data.outgoing.map((f) => (
            <div key={f.id} className="rounded-xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--cc-surface)] border border-[var(--cc-border)] text-[var(--cc-muted)] font-bold flex items-center justify-center shrink-0">
                {(f.to_username || "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.to_username}</div>
                <div className="text-xs text-[var(--cc-muted)]">waiting for their response</div>
              </div>
              <button
                onClick={() => respond(f, false)}
                title="Cancel request"
                className="p-2 text-[var(--cc-muted)] hover:text-red-400 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "blocked" && (
        <div className="space-y-2">
          {blockedProfiles.length === 0 && (
            <p className="text-sm text-[var(--cc-muted)] text-center py-12">You haven't blocked anyone.</p>
          )}
          {blockedProfiles.map((p) => (
            <div key={p.id} className="rounded-xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-3 flex items-center gap-3">
              <Avatar profile={p} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.display_name || p.username}</div>
                <div className="text-xs text-[var(--cc-muted)]">@{p.username}</div>
              </div>
              <button
                onClick={() => unblock(p)}
                className="px-3 py-1.5 rounded-lg bg-[var(--cc-accent)] text-black text-xs font-medium"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}