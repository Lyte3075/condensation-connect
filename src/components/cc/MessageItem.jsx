import React from "react";
import moment from "moment";

export default function MessageItem({ msg }) {
  const isBot = msg.author_id === "condensation-bot";
  const time = moment(msg.created_date).format("h:mm A");
  const initial = (msg.author_username || "?")[0]?.toUpperCase();
  return (
    <div className="flex gap-3 px-4 py-1.5 hover:bg-[var(--cc-hover)] group">
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[var(--cc-accent)] text-black flex items-center justify-center font-bold">
        {msg.author_avatar ? (
          <img src={msg.author_avatar} className="w-full h-full object-cover" alt="" />
        ) : (
          <span className="text-sm">{initial}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-semibold text-sm ${isBot ? "text-[var(--cc-accent)]" : "text-[var(--cc-text)]"}`}
          >
            {msg.author_username || "Unknown"}
          </span>
          <span className="text-xs text-[var(--cc-muted)]">{time}</span>
        </div>
        <div className="text-[var(--cc-text)] text-sm whitespace-pre-wrap break-words leading-relaxed">
          {msg.content}
        </div>
      </div>
    </div>
  );
}