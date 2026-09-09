import React, { useEffect, useRef } from "react";
import { MicOff, Hand } from "lucide-react";

// Plays a remote MediaStream: visible video when it has one, a hidden element
// otherwise so the audio still flows.
export function MediaStreamPlayer({ stream, muted, visible }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className={
        visible
          ? "absolute inset-0 w-full h-full object-cover"
          : "absolute w-px h-px opacity-0 pointer-events-none"
      }
    />
  );
}

export default function CallTile({ user, state, role, stream, showVideo, muted, isStage, action }) {
  const name = user?.display || user?.username || "?";
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--cc-surface)] border border-[var(--cc-border)]">
      {stream && <MediaStreamPlayer stream={stream} muted={muted} visible={!!showVideo} />}
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[var(--cc-accent)] text-black font-bold flex items-center justify-center text-xl">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      )}
      {action && <div className="absolute top-1.5 right-1.5">{action}</div>}
      <div className="absolute bottom-0 inset-x-0 p-2 flex items-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-xs font-medium text-white truncate">{name}</span>
        {state?.mic === false && <MicOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
        {state?.hand && <Hand className="w-3.5 h-3.5 text-[var(--cc-accent)] flex-shrink-0" />}
        {isStage && role && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-white flex-shrink-0">
            {role === "host" ? "Host" : role === "speaker" ? "Speaker" : "Audience"}
          </span>
        )}
      </div>
    </div>
  );
}