"use client";
import { CSSProperties, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

export type DropdownOption<T extends string> = { value: T; label: ReactNode };

export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  style,
  triggerStyle,
  disabled,
  inline,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
  style?: CSSProperties;
  triggerStyle?: CSSProperties;
  disabled?: boolean;
  // Open the list in the page flow instead of floating, for scrollable containers (modals) that would clip it
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Open upwards when there isn't room below the trigger (e.g. near the bottom of the
  // screen), so the list doesn't stretch the page or fall off the screen
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open || inline || !ref.current || !menuRef.current) return;
    const r = ref.current.getBoundingClientRect();
    const h = menuRef.current.offsetHeight + 8;
    setUp(window.innerHeight - r.bottom < h && r.top > window.innerHeight - r.bottom);
  }, [open, inline]);
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
        <div ref={menuRef} className={inline ? "ddown-menu inline" : up ? "ddown-menu up" : "ddown-menu"} role="listbox">
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
