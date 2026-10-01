"use client";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";

export default function Toast() {
  const { toastMessage, toastAction, toast } = useStore();
  const { t } = useT();
  return (
    <div className={`toast ${toastMessage ? "on" : ""}`} role="status">
      {toastMessage}
      {toastAction && (
        <button
          className="toast-action"
          onClick={() => {
            toastAction.run();
            toast(t("toast.restored"));
          }}
        >
          {toastAction.label}
        </button>
      )}
    </div>
  );
}
