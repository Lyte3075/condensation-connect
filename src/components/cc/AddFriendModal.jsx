import React, { useState, useEffect } from "react";
import Modal from "@/components/cc/Modal";
import { Search } from "lucide-react";

export default function AddFriendModal({ open, onClose, onSend }) {
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setUsername("");
      setMsg("");
    }
  }, [open]);

  const send = async () => {
    if (!username.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      await onSend(username.trim());
      setMsg("✓ Friend request sent!");
      setUsername("");
    } catch (e) {
      setMsg(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a friend" subtitle="Enter their username to send a request." maxWidth="max-w-md">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] focus-within:border-[var(--cc-accent)]">
            <Search className="w-4 h-4 text-[var(--cc-muted)]" />
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="username"
              className="flex-1 h-10 bg-transparent outline-none text-[var(--cc-text)] placeholder-[var(--cc-muted)]"
            />
          </div>
          <button
            onClick={send}
            disabled={busy || !username.trim()}
            className="px-4 rounded-lg bg-[var(--cc-accent)] text-black font-medium text-sm disabled:opacity-60"
          >
            {busy ? "…" : "Send"}
          </button>
        </div>
        {msg && <div className="text-sm text-[var(--cc-muted)]">{msg}</div>}
      </div>
    </Modal>
  );
}