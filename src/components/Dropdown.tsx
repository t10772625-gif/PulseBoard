"use client";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

export type DropdownOption<T extends string> = { value: T; label: ReactNode };

export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  style,
  triggerStyle,
  disabled,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
  style?: CSSProperties;
  triggerStyle?: CSSProperties;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

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

  return (
    <div className="ddown" ref={ref} style={style}>
      <button
        type="button"
        className="ddown-trigger"
        style={disabled ? { ...triggerStyle, opacity: 0.6, cursor: "default" } : triggerStyle}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{current?.label ?? value}</span>
        {!disabled && <span className="ddown-caret">▾</span>}
      </button>
      {open && !disabled && (
        <div className="ddown-menu" role="listbox">
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              className={o.value === value ? "sel" : ""}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
