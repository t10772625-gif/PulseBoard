"use client";
import { ReactNode } from "react";
import { useT } from "@/i18n/I18nProvider";

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useT();
  return (
    <>
      <div className="ov on" style={{ zIndex: 50 }} onClick={onClose}></div>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="meta" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="ic" aria-label={t("common.close")} onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
