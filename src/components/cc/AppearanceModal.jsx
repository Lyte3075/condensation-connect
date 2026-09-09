import React, { useState, useEffect, useRef } from "react";
import Modal from "@/components/cc/Modal";
import { Moon, Sun, Monitor, Check, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { ACCENTS, FONTS, BACKGROUNDS, isLightColor } from "@/lib/ccUtils";

function applyMode(mode) {
  const root = document.documentElement;
  const resolved =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : mode;
  const vars =
    resolved === "light"
      ? {
          "--cc-bg": "#f7f7f8",
          "--cc-surface": "#ffffff",
          "--cc-rail": "#ececee",
          "--cc-sidebar": "#ffffff",
          "--cc-hover": "#f0f0f2",
          "--cc-text": "#0a0a0a",
          "--cc-muted": "#6b7280",
          "--cc-border": "#e5e5e7",
          "--cc-input": "#f2f2f4",
        }
      : {
          "--cc-bg": "#121212",
          "--cc-surface": "#1a1a1a",
          "--cc-rail": "#161616",
          "--cc-sidebar": "#1a1a1a",
          "--cc-hover": "#222222",
          "--cc-text": "#ffffff",
          "--cc-muted": "#a0a0a0",
          "--cc-border": "#2a2a2a",
          "--cc-input": "#1e1e1e",
        };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export default function AppearanceModal({ open, onClose, profile, onSave }) {
  const [mode, setMode] = useState("dark");
  const [accent, setAccent] = useState("#CCFF00");
  const [font, setFont] = useState("jakarta");
  const [bg, setBg] = useState("none");
  const fileRef = useRef(null);
  const customBgUrl = /^https?:\/\//.test(bg) ? bg : null;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setBg(file_url);
  };

  useEffect(() => {
    if (open) {
      setMode(profile?.theme_mode || "dark");
      setAccent(profile?.accent_color || "#CCFF00");
      setFont(profile?.font_family || "jakarta");
      setBg(profile?.chat_bg || "none");
    }
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.setProperty("--cc-accent", accent);
    root.style.setProperty("--cc-accent-fg", isLightColor(accent) ? "#0a0a0a" : "#ffffff");
  }, [accent, open]);

  useEffect(() => {
    if (!open) return;
    applyMode(mode);
  }, [mode, open]);

  const save = async () => {
    await onSave({ theme_mode: mode, accent_color: accent, font_family: font, chat_bg: bg });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Customize appearance" subtitle="Changes apply instantly.">
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-2">
            Appearance Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "dark", label: "Dark", Icon: Moon },
              { id: "light", label: "Light", Icon: Sun },
              { id: "system", label: "System", Icon: Monitor },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setMode(o.id)}
                className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border ${
                  mode === o.id ? "border-[var(--cc-accent)] bg-[var(--cc-hover)]" : "border-[var(--cc-border)]"
                }`}
              >
                <o.Icon className="w-4 h-4 text-[var(--cc-text)]" />
                <span className="text-sm text-[var(--cc-text)]">{o.label}</span>
                {mode === o.id && <Check className="w-4 h-4 absolute right-3 text-[var(--cc-accent)]" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-2">
            Accent Color
          </label>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccent(a.value)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  accent === a.value ? "ring-2 ring-offset-2 ring-offset-[var(--cc-surface)] ring-[var(--cc-text)]" : ""
                }`}
                style={{ background: a.value }}
              >
                {accent === a.value && <Check className="w-4 h-4" style={{ color: a.fg }} />}
              </button>
            ))}
          </div>
          <div className="h-3 rounded-full mt-3" style={{ background: accent }} />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-2">
            Font Family
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                className={`px-3 py-3 rounded-xl border text-left ${
                  font === f.id ? "border-[var(--cc-accent)] bg-[var(--cc-hover)]" : "border-[var(--cc-border)]"
                }`}
                style={{ fontFamily: f.stack }}
              >
                <span className="text-sm text-[var(--cc-text)]">Aa {f.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-2">
            Chat Background
          </label>
          <div className="flex gap-2 flex-wrap">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBg(b.id)}
                className={`w-14 h-14 rounded-xl border bg-[var(--cc-input)] flex items-center justify-center ${
                  bg === b.id ? "border-[var(--cc-accent)]" : "border-[var(--cc-border)]"
                }`}
                style={b.style}
              >
                <span className="text-[10px] text-[var(--cc-muted)]">{b.name}</span>
              </button>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className={`relative w-14 h-14 rounded-xl border overflow-hidden flex items-center justify-center bg-[var(--cc-input)] ${
                customBgUrl ? "border-[var(--cc-accent)]" : "border-[var(--cc-border)]"
              }`}
            >
              {customBgUrl ? (
                <>
                  <img src={customBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <Check className="relative w-4 h-4 text-white bg-black/50 rounded-full p-0.5" />
                </>
              ) : (
                <Upload className="w-5 h-5 text-[var(--cc-muted)]" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
          </div>
          <p className="text-xs text-[var(--cc-muted)] mt-2">
            Upload an image, GIF, or video to use as your own chat background.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            className="px-5 py-2 rounded-lg bg-[var(--cc-accent)] text-black font-medium text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}