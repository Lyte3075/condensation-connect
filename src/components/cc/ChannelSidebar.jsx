import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Hash, Plus, Users, UserPlus, UserCheck, Settings, Volume2, Radio } from "lucide-react";

export default function ChannelSidebar(props) {
  const {
    mode,
    server,
    channels,
    dmChannels,
    friends,
    pending,
    selectedChannelId,
    onSelectChannel,
    onCreateChannel,
    onAddFriend,
    onNewGroup,
    onOpenFriendDM,
    onAcceptFriend,
    onDeclineFriend,
    currentUserId,
  } = props;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [newType, setNewType] = useState("text");

  const submitChannel = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateChannel(name.trim(), newType);
    setName("");
    setAdding(false);
  };

  if (mode === "dm") {
    const groups = dmChannels.filter((c) => c.type === "group");
    return (
      <div className="w-60 md:w-64 flex-shrink-0 bg-[var(--cc-sidebar)] border-r border-[var(--cc-border)] flex flex-col cc-clear-tabbar">
        <div className="min-h-14 cc-safe-top flex items-center px-4 border-b border-[var(--cc-border)] font-semibold text-[var(--cc-text)]">
          Direct Messages
        </div>
        <div className="p-2 flex gap-2">
          <button
            onClick={onAddFriend}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--cc-accent)] text-black text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" /> Add Friend
          </button>
          <button
            onClick={onNewGroup}
            className="px-2.5 py-2 rounded-lg bg-[var(--cc-surface)] text-[var(--cc-text)] hover:bg-[var(--cc-hover)]"
            title="New group chat"
          >
            <Users className="w-4 h-4" />
          </button>
          <Link
            to="/friend-list"
            className="px-2.5 py-2 rounded-lg bg-[var(--cc-surface)] text-[var(--cc-text)] hover:bg-[var(--cc-hover)]"
            title="All friends, requests, and blocked users"
          >
            <UserCheck className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {pending.length > 0 && (
            <>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] px-2 mt-2 mb-1">
                Pending — {pending.length}
              </div>
              {pending.map((f) => (
                <div key={f.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--cc-hover)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--cc-accent)] text-black flex items-center justify-center text-xs font-bold">
                    {(f.from_username || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--cc-text)] truncate">{f.from_username}</div>
                    <div className="text-xs text-[var(--cc-muted)]">wants to be friends</div>
                  </div>
                  <button
                    onClick={() => onAcceptFriend(f)}
                    className="w-7 h-7 rounded-full bg-[var(--cc-accent)] text-black flex items-center justify-center text-xs"
                    title="Accept"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onDeclineFriend(f)}
                    className="w-7 h-7 rounded-full bg-[var(--cc-surface)] text-[var(--cc-muted)] flex items-center justify-center text-xs"
                    title="Decline"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </>
          )}

          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] px-2 mt-3 mb-1">
            Friends — {friends.length}
          </div>
          {friends.length === 0 && (
            <div className="text-xs text-[var(--cc-muted)] px-2 py-1">No friends yet. Add someone!</div>
          )}
          {friends.map((f) => {
            const fname = f.from_user_id === currentUserId ? f.to_username : f.from_username;
            return (
              <button
                key={f.id}
                onClick={() => onOpenFriendDM(f)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--cc-hover)] text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--cc-accent)] text-black flex items-center justify-center text-xs font-bold">
                  {(fname || "?")[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-[var(--cc-text)] truncate">{fname}</span>
              </button>
            );
          })}

          {groups.length > 0 && (
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] px-2 mt-3 mb-1">
              Group Chats
            </div>
          )}
          {groups.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectChannel(c.id)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left ${
                selectedChannelId === c.id ? "bg-[var(--cc-hover)]" : "hover:bg-[var(--cc-hover)]"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--cc-surface)] border border-[var(--cc-border)] flex items-center justify-center">
                <Users className="w-4 h-4 text-[var(--cc-muted)]" />
              </div>
              <span className="text-sm text-[var(--cc-text)] truncate">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const textChannels = channels.filter((c) => c.type === "text");
  const callChannels = channels.filter((c) => c.type === "voice" || c.type === "stage");

  const renderCallChannel = (c) => {
    const Icon = c.type === "stage" ? Radio : Volume2;
    return (
      <button
        key={c.id}
        onClick={() => onSelectChannel(c.id)}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-sm ${
          selectedChannelId === c.id
            ? "bg-[var(--cc-hover)] text-[var(--cc-text)]"
            : "text-[var(--cc-muted)] hover:bg-[var(--cc-hover)] hover:text-[var(--cc-text)]"
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{c.name}</span>
      </button>
    );
  };

  return (
    <div className="w-60 md:w-64 flex-shrink-0 bg-[var(--cc-sidebar)] border-r border-[var(--cc-border)] flex flex-col cc-clear-tabbar">
      <div className="min-h-14 cc-safe-top flex items-center gap-2 px-4 border-b border-[var(--cc-border)]">
        <span className="font-semibold text-[var(--cc-text)] truncate flex-1">{server?.name || "Server"}</span>
        {server && (
          <Link
            to={`/server-settings?server=${server.id}`}
            className="p-1.5 text-[var(--cc-muted)] hover:text-[var(--cc-text)] hover:bg-[var(--cc-hover)] rounded-lg flex-shrink-0"
            title="Server settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)]">Text Channels</span>
          <button
            onClick={() => setAdding((a) => !a)}
            title="New channel"
            className="text-[var(--cc-muted)] hover:text-[var(--cc-text)]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {adding && (
          <form onSubmit={submitChannel} className="px-2 mb-2">
            <div className="flex gap-1 mb-1">
              {[
                { id: "text", label: "# Text" },
                { id: "voice", label: "Voice" },
                { id: "stage", label: "Stage" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNewType(t.id)}
                  className={`flex-1 text-xs py-1 rounded-md font-medium ${
                    newType === t.id
                      ? "bg-[var(--cc-accent)] text-black"
                      : "bg-[var(--cc-surface)] text-[var(--cc-muted)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={newType === "text" ? "new-channel" : "Channel name"}
                className="flex-1 h-8 px-2 rounded-md bg-[var(--cc-input)] border border-[var(--cc-border)] text-sm text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)]"
              />
              <button title="Create channel" className="h-8 px-2 rounded-md bg-[var(--cc-accent)] text-black text-sm">
                +
              </button>
            </div>
          </form>
        )}
        {textChannels.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectChannel(c.id)}
            className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-sm ${
              selectedChannelId === c.id
                ? "bg-[var(--cc-hover)] text-[var(--cc-text)]"
                : "text-[var(--cc-muted)] hover:bg-[var(--cc-hover)] hover:text-[var(--cc-text)]"
            }`}
          >
            <Hash className="w-4 h-4 flex-shrink-0" />
            {c.name}
          </button>
        ))}

        <div className="flex items-center justify-between px-2 mt-4 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)]">Voice & Stage</span>
          <button
            onClick={() => {
              setNewType("voice");
              setAdding((a) => !a);
            }}
            className="text-[var(--cc-muted)] hover:text-[var(--cc-text)]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {callChannels.length === 0 && (
          <div className="text-xs text-[var(--cc-muted)] px-2 py-1">No voice channels yet.</div>
        )}
        {callChannels.map(renderCallChannel)}
      </div>
    </div>
  );
}