import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, subtitle, children, maxWidth = "max-w-lg" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] shadow-2xl`}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <div className="flex items-start justify-between p-5 border-b border-[var(--cc-border)] sticky top-0 bg-[var(--cc-surface)] z-10">
              <div>
                <h2 className="text-lg font-bold text-[var(--cc-text)]">{title}</h2>
                {subtitle && <p className="text-sm text-[var(--cc-muted)] mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="text-[var(--cc-muted)] hover:text-[var(--cc-text)] p-1 rounded-lg hover:bg-[var(--cc-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}