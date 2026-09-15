import { useEffect, useId, useRef, useState } from "react";

export interface ColorOption {
  label: string;
  value: string;
}

interface ColorPickerDropdownProps {
  name: string;
  colors: readonly ColorOption[];
  activeValue: string;
  emptySwatchLabel: string;
  onSelect: (value: string) => void;
}

function normalizeColor(value: string): string {
  return value.trim().toLowerCase();
}

function isColorActive(activeValue: string, optionValue: string): boolean {
  if (!activeValue && !optionValue) {
    return true;
  }
  return normalizeColor(activeValue) === normalizeColor(optionValue);
}

export default function ColorPickerDropdown({
  name,
  colors,
  activeValue,
  emptySwatchLabel,
  onSelect,
}: ColorPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !rootRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const activeOption = colors.find((color) => isColorActive(activeValue, color.value)) ?? colors[0];
  const previewColor = activeOption?.value || "#ffffff";
  const isEmptyActive = !activeOption?.value;

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-1.5 text-xs font-medium text-slate-700 hover:border-slate-200 hover:bg-white"
        aria-label={name}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        title={name}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{name}</span>
        <span
          className={`inline-block h-4 w-4 rounded-sm border border-slate-300 ${
            isEmptyActive ? "bg-[linear-gradient(135deg,#fff_46%,#f87171_46%,#f87171_54%,#fff_54%)]" : ""
          }`}
          style={isEmptyActive ? undefined : { backgroundColor: previewColor }}
          aria-hidden
        />
        <span className="text-[10px] text-slate-400" aria-hidden>
          ▾
        </span>
      </button>

      {isOpen ? (
        <div
          id={listId}
          role="listbox"
          aria-label={name}
          className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-slate-200 bg-white p-2 shadow-lg"
        >
          <div className="grid grid-cols-5 gap-1.5">
            {colors.map((color) => {
              const isActive = isColorActive(activeValue, color.value);
              const isEmpty = color.value === "";
              return (
                <button
                  key={`${name}-${color.label}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  title={color.label}
                  aria-label={color.label}
                  className={`h-7 w-7 rounded-sm border ${
                    isActive ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-300"
                  } ${isEmpty ? "bg-[linear-gradient(135deg,#fff_46%,#f87171_46%,#f87171_54%,#fff_54%)]" : ""}`}
                  style={isEmpty ? undefined : { backgroundColor: color.value }}
                  onClick={() => {
                    onSelect(color.value);
                    setIsOpen(false);
                  }}
                />
              );
            })}
          </div>
          <p className="mt-2 truncate text-[11px] text-slate-500">
            {activeOption?.label ?? emptySwatchLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
}
