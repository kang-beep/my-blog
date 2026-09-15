import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import TagForceGraph from "@/features/tags/components/TagForceGraph";

export default function TagNetworkFullscreenModal({ isOpen, onClose, nodes, edges }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="tag-network-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-10"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="tag-network-modal-window flex w-full flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-network-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <h2 id="tag-network-modal-title" className="text-base font-semibold text-slate-900 sm:text-lg">
            Tag Network
          </h2>
          <button type="button" className="btn shrink-0 px-2 py-1.5" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="tag-network-modal-body min-h-0 flex-1 p-3 sm:p-4">
          <TagForceGraph nodes={nodes} edges={edges} fillContainer />
        </div>
      </div>
    </div>,
    document.body,
  );
}
