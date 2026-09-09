import React, { useState, useEffect } from "react";
import Modal from "@/components/cc/Modal";

export default function CreateServerModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setIcon("");
      setDescription("");
      setIsPublic(false);
    }
  }, [open]);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate(name.trim(), icon, isPublic, description.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a server" subtitle="Give it a name to get started." maxWidth="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
            Server Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My awesome server"
            className="w-full h-10 px-3 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
            Icon URL (optional)
          </label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="https://…"
            className="w-full h-10 px-3 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="What's this server about?"
            className="w-full px-3 py-2 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)] resize-none"
          />
        </div>
        <button
          onClick={() => setIsPublic((v) => !v)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--cc-border)] text-left hover:bg-[var(--cc-hover)]"
        >
          <span
            className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors shrink-0 ${
              isPublic ? "bg-[var(--cc-accent)]" : "bg-[var(--cc-border)]"
            }`}
          >
            <span className={`w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? "translate-x-4" : ""}`} />
          </span>
          <span>
            <span className="block text-sm font-medium">Public server</span>
            <span className="block text-xs text-[var(--cc-muted)] mt-0.5">
              List this server in discovery so anyone can browse and join it.
            </span>
          </span>
        </button>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[var(--cc-muted)] hover:text-[var(--cc-text)]">
            Cancel
          </button>
          <button
            onClick={create}
            disabled={saving || !name.trim()}
            className="px-5 py-2 rounded-lg bg-[var(--cc-accent)] text-black font-medium text-sm disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}