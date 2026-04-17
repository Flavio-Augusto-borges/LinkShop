"use client";

import type { ReactNode } from "react";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = "Continuar",
  cancelLabel = "Cancelar",
  confirmTone = "primary",
  onConfirm,
  onCancel,
  children
}: ConfirmationModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onCancel}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative z-[71] w-full max-w-2xl rounded-[1.5rem] border border-black/10 bg-white p-6 shadow-glow">
        <h3 className="font-display text-3xl text-ink">{title}</h3>
        {description ? <p className="mt-2 text-sm text-neutral-600">{description}</p> : null}

        {children ? <div className="mt-4">{children}</div> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-black/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white ${
              confirmTone === "danger" ? "bg-coral hover:bg-orange-600" : "bg-ink hover:bg-neutral-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
