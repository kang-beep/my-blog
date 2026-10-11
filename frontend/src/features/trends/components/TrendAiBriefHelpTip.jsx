import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
import { TREND_AI_SOURCES } from "@/features/trends/constants/trendAiDigests";

const DEFAULT_MODEL = "gemini-flash-latest";

function buildHelpText(source, model) {
  const modelName = model?.trim() || DEFAULT_MODEL;
  if (source === TREND_AI_SOURCES.GITHUB || source === "github") {
    return `Generated with ${modelName}. Analyzed the full trending list for this period.`;
  }
  return `Generated with ${modelName}. Analyzed the top 5 papers by upvotes.`;
}

function useCloseOnOutsideClick(isOpen, rootRef, setIsOpen) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, rootRef, setIsOpen]);
}

export default function TrendAiBriefHelpTip({ source, model = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const tipId = useId();
  const helpText = buildHelpText(source, model);

  useCloseOnOutsideClick(isOpen, rootRef, setIsOpen);

  return (
    <span className="trend-ai-help" ref={rootRef}>
      <button
        type="button"
        className="trend-ai-help-trigger"
        aria-label="How this AI brief is generated"
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tipId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <CircleHelp size={14} aria-hidden />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className={isOpen ? "trend-ai-help-bubble is-open" : "trend-ai-help-bubble"}
      >
        {helpText}
      </span>
    </span>
  );
}
