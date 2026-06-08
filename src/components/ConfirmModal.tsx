"use client";

import React, { useState, useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  isDanger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setAnimateOut(false);
    } else {
      setAnimateOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 180); // matches the duration of confirm-modal-hide (0.18s)
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
      animateOut ? "confirm-backdrop-hide" : "confirm-backdrop-show"
    }`}>
      {/* Backdrop click handler to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onCancel} />

      {/* Modal Card */}
      <div className={`bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl p-5 max-w-[340px] w-full z-50 flex flex-col items-center text-center ${
        animateOut ? "confirm-modal-hide" : "confirm-modal-show"
      }`}>
        {/* Warning Icon Header */}
        <div className={`rounded-full p-3 mb-4 flex items-center justify-center ${
          isDanger ? "bg-error-container/20 text-error" : "bg-primary-container/20 text-primary"
        }`}>
          <span className="material-symbols-outlined text-[32px] font-bold select-none">
            {isDanger ? "delete_forever" : "info"}
          </span>
        </div>

        {/* Text Details */}
        <h3 className="font-headline-md text-on-surface font-bold text-base mb-1.5 select-none">
          {title}
        </h3>
        <p className="font-body-sm text-on-surface-variant text-sm leading-relaxed mb-5 select-none">
          {message}
        </p>

        {/* Buttons Footer */}
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-outline bg-surface-container-lowest hover:bg-surface-container-low text-primary font-semibold text-sm cursor-pointer transition-all active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-all border-none shadow-sm active:scale-[0.98] ${
              isDanger 
                ? "bg-error text-on-error hover:bg-error/90" 
                : "bg-primary text-on-primary hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
