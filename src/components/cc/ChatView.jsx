import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ChevronLeft, Send, Users, Settings } from "lucide-react";
import MessageItem from "@/components/cc/MessageItem";
import { Image } from "@/components/ui/image";
import { BACKGROUNDS, createNotification } from "@/lib/ccUtils";

export default function ChatView({ channel, title, subtitle, me, chatBg, onBack, onToggleMembers, canManageChannel, canSend = true }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const channelIdRef = useRef(channel.id);

  useEffect(() => {
    channelIdRef.current = channel.id;
  }, [channel.id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const msgs = await base44.entities.Message.filter({ channel_id: channel.id }, "-created_date", 200);
      if (!active) return;
      setMessages(msgs.reverse());
      setLoading(false);
    })();
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.channel_id !== channelIdRef.current) return;
      if (event.type === "create") {
        setMessages((prev) => (prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]));
      } else if (event.type === "delete") {
        setMessages((prev) => prev.filter((m) => m.id !== event.data.id));
      }
    });
    return () => {
      active = false;
      unsub && unsub();
    };
  }, [channel.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    await base44.entities.Message.create({
      channel_id: channel.id,
      author_id: me.id,
      author_username: me.username,
      author_avatar: me.avatar,
      content,
    });

    // notify anyone @mentioned in this message
    const tokens = [...new Set((content.match(/@([a-zA-Z0-9_.]{2,20})/g) || []).map((t) => t.slice(1).toLowerCase()))]
      .filter((t) => t !== me.username?.toLowerCase());
    for (const t of tokens) {
      const p = (await base44.entities.Profile.filter({ username: t }, "-created_date", 1))[0];
      if (p && p.user_id !== me.id) {
        await createNotification({
          user_id: p.user_id,
          type: "mention",
          actor_username: me.username,
          actor_avatar: me.avatar,
          title: "You were mentioned",
          body: `@${me.username} in ${channel.type === "text" ? "#" + title : title}: ${content.slice(0, 100)}`,
          channel_id: channel.id,
          server_id: channel.server_id || "",
        });
      }
    }
  };

  const bg = BACKGROUNDS.find((b) => b.id === chatBg) || BACKGROUNDS[0];
  const customBg = /^https?:\/\//.test(chatBg || "") ? chatBg : null;
  const isVideo = /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(customBg || "");

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <div className="min-h-14 cc-safe-top flex items-center gap-3 px-3 border-b border-[var(--cc-border)] bg-[var(--cc-sidebar)]">
        <button onClick={onBack} className="md:hidden text-[var(--cc-muted)] hover:text-[var(--cc-text)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        {channel.type === "text" && <span className="text-[var(--cc-accent)] font-semibold">#</span>}
        <div className="min-w-0">
          <div className="font-semibold text-[var(--cc-text)] truncate">{title}</div>
          <div className="text-xs text-[var(--cc-muted)] truncate">{subtitle}</div>
        </div>
        {canManageChannel && (
          <Link
            to={`/channel-settings?channel=${channel.id}`}
            title="Channel settings"
            className="ml-auto p-1.5 text-[var(--cc-muted)] hover:text-[var(--cc-text)] hover:bg-[var(--cc-hover)] rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </Link>
        )}
        <button
          onClick={onToggleMembers}
          title="Toggle member list"
          className={`${canManageChannel ? "" : "ml-auto"} p-1.5 text-[var(--cc-muted)] hover:text-[var(--cc-text)] hover:bg-[var(--cc-hover)] rounded-lg`}
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0" style={bg.style}>
        {customBg && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {isVideo ? (
              <video
                src={customBg}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image src={customBg} alt="" className="absolute inset-0 w-full h-full" fittingType="fill" />
            )}
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto py-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[var(--cc-muted)] text-sm">
              Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[var(--cc-muted)] text-sm">
              No messages yet. Say hi!
            </div>
          ) : (
            messages.map((m) => <MessageItem key={m.id} msg={m} />)
          )}
        </div>
      </div>

      <form onSubmit={send} className="p-3 border-t border-[var(--cc-border)] bg-[var(--cc-sidebar)] cc-clear-tabbar">
        <div className="flex items-center gap-2 bg-[var(--cc-input)] rounded-xl px-3 py-2 border border-[var(--cc-border)] focus-within:border-[var(--cc-accent)]">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!canSend}
            placeholder={
              canSend
                ? `Message ${channel.type === "text" ? "#" + title : title}`
                : "Only server admins can post here"
            }
            className="flex-1 bg-transparent outline-none text-[var(--cc-text)] placeholder-[var(--cc-muted)] text-sm disabled:opacity-60"
          />
          <button type="submit" disabled={!text.trim() || !canSend} className="text-[var(--cc-accent)] disabled:opacity-40">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}