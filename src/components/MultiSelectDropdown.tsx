"use client";
import { ReactNode, useEffect, useRef, useState } from "react";

export type MultiOption<T extends string> = { value: T; label: ReactNode };

export default function MultiSelectDropdown<T extends string>({
  values,
  options,
  onToggle,
  onClear,
  placeholder,
}: {
  values: T[];
  options: MultiOption<T>[];
  onToggle: (v: T) => void;
  onClear: () => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = values.length ? `${placeholder} (${values.length})` : placeholder;

  return (
    <div className="ddown" ref={ref}>
      <button type="button" className={`ghost ${values.length ? "on" : ""}`} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && (
        <div className="ddown-menu">
          {options.map((o) => (
            <label key={o.value} className="ddown-check">
              <input type="checkbox" checked={values.includes(o.value)} onChange={() => onToggle(o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
          {values.length > 0 && (
            <button type="button" className="ddown-clear" onClick={onClear}>
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
