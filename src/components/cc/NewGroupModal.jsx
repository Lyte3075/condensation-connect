import React, { useState, useEffect } from "react";
import Modal from "@/components/cc/Modal";
import { Check } from "lucide-react";

export default function NewGroupModal({ open, onClose, friends, currentUserId, onCreate }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (open) {
      setName("");
      setSelected([]);
    }
  }, [open]);

  const toggle = (fid) => {
    setSelected((prev) => (prev.includes(fid) ? prev.filter((x) => x !== fid) : [...prev, fid]));
  };

  const create = async () => {
    if (!name.trim() || selected.length === 0) return;
    await onCreate(name.trim(), selected);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New group chat" subtitle="Add friends and name your group." maxWidth="max-w-md">
      <div className="space-y-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full h-10 px-3 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)]"
        />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-2">Add members</div>
          {friends.length === 0 ? (
            <div className="text-sm text-[var(--cc-muted)]">No friends yet. Add some first!</div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {friends.map((f) => {
                const fid = f.from_user_id === currentUserId ? f.to_user_id : f.from_user_id;
                const fname = f.from_user_id === currentUserId ? f.to_username : f.from_username;
                const on = selected.includes(fid);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggle(fid)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                      on ? "bg-[var(--cc-hover)]" : "hover:bg-[var(--cc-hover)]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        on ? "bg-[var(--cc-accent)] border-[var(--cc-accent)]" : "border-[var(--cc-border)]"
                      }`}
                    >
                      {on && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <span className="text-sm text-[var(--cc-text)]">{fname}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={create}
            disabled={!name.trim() || selected.length === 0}
            className="px-5 py-2 rounded-lg bg-[var(--cc-accent)] text-black font-medium text-sm disabled:opacity-60"
          >
            Create group
          </button>
        </div>
      </div>
    </Modal>
  );
}