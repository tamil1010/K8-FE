import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Generic confirmation dialog.
 * Props:
 *   isOpen        {boolean}
 *   title         {string}
 *   message       {string}
 *   confirmLabel  {string}   — default "Confirm"
 *   cancelLabel   {string}   — default "Cancel"
 *   variant       {string}   — "danger" | "warning" (default "danger")
 *   onConfirm     {function}
 *   onCancel      {function}
 *   loading       {boolean}  — disables buttons when true
 */
export const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false
}) => {
  if (!isOpen) return null;

  const isDanger  = variant === 'danger';
  const iconBg    = isDanger ? 'bg-red-100'    : 'bg-amber-100';
  const iconColor = isDanger ? 'text-red-600'  : 'text-amber-600';
  const btnBase   = isDanger
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={!loading ? onCancel : undefined}
      />

      {/* Dialog */}
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6 animate-[fadeIn_0.15s_ease-out]">
        {/* Close */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${iconBg} mb-4`}>
          <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>

        {/* Message */}
        {message && (
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{message}</p>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2 ${btnBase}`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
