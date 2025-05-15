import React from "react";

/**
 * Responsive and attractive confirmation dialog for delete/email actions.
 * Props:
 * - open: boolean (show/hide dialog)
 * - title: string
 * - message: string
 * - confirmText: string (e.g., "Delete")
 * - cancelText: string (e.g., "Cancel")
 * - onConfirm: function
 * - onCancel: function
 */
export default function ConfirmDialog({ open, title, message, confirmText = "OK", cancelText = "Cancel", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white max-w-xs w-full rounded-xl shadow-lg p-6 mx-2 animate-fadein flex flex-col items-center">
        <div className="text-2xl font-semibold text-center text-red-600 mb-2">
          {title}
        </div>
        <div className="text-base text-gray-700 text-center mb-4">
          {message}
        </div>
        <div className="flex w-full gap-3 mt-2">
          <button
            className="flex-1 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            className="flex-1 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors shadow"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
