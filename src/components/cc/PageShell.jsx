import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomTabs from "@/components/cc/BottomTabs";

export default function PageShell({ title, subtitle, children }) {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen bg-[var(--cc-bg,#121212)] text-[var(--cc-text,#ffffff)]"
      style={{ fontFamily: "var(--cc-font)" }}
    >
      <div className="min-h-14 cc-safe-top flex items-center gap-3 px-4 border-b border-[var(--cc-border,#2a2a2a)] bg-[var(--cc-surface,#1a1a1a)] sticky top-0 z-10">
        <button
          onClick={() => navigate("/")}
          className="p-1.5 text-[var(--cc-muted,#a0a0a0)] hover:text-[var(--cc-text)] hover:bg-[var(--cc-hover)] rounded-lg"
          title="Back to app"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          {subtitle && <div className="text-xs text-[var(--cc-muted)] truncate">{subtitle}</div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto p-4 cc-clear-tabbar">{children}</div>
      <BottomTabs />
    </div>
  );
}