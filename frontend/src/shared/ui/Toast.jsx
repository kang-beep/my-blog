import { useEffect } from "react";

const DEFAULT_DURATION_MS = 3000;

export default function Toast({ message, visible, onClose, durationMs = DEFAULT_DURATION_MS }) {
  useEffect(() => {
    if (!visible || !message) {
      return;
    }

    const timerId = window.setTimeout(() => {
      onClose?.();
    }, durationMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [visible, message, durationMs, onClose]);

  if (!visible || !message) {
    return null;
  }

  return (
    <div className="toast-banner pointer-events-none fixed inset-x-0 top-14 z-50 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="max-w-md rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-medium text-emerald-800 shadow-md"
      >
        {message}
      </div>
    </div>
  );
}
