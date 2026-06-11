"use client";

import { useTranslations } from "next-intl";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: "default" | "danger";
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
  variant = "default",
}: ConfirmModalProps) {
  const tc = useTranslations("common");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-panel animate-slide-up">
        <h3 className="text-lg font-bold text-gradient-gold mb-2">{title}</h3>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-outline px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-all ${
              variant === "danger"
                ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
                : "btn-primary"
            }`}
          >
            {loading ? tc("loading") : (confirmLabel ?? tc("confirm"))}
          </button>
        </div>
      </div>
    </div>
  );
}
