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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-xl max-w-md w-full p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-yellow-500 mb-2">{title}</h3>
        <p className="text-gray-300 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-bold disabled:opacity-50 ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-yellow-500 hover:bg-yellow-400 text-black"
            }`}
          >
            {loading ? tc("loading") : (confirmLabel ?? tc("confirm"))}
          </button>
        </div>
      </div>
    </div>
  );
}
