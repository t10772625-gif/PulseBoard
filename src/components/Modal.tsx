"use client";
import { ReactNode } from "react";

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="ov on" style={{ zIndex: 50 }} onClick={onClose}></div>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="meta" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="ic" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
