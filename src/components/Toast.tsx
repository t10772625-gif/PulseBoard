"use client";
import { useStore } from "@/lib/store";

export default function Toast() {
  const { toastMessage, toastAction, toast } = useStore();
  return (
    <div className={`toast ${toastMessage ? "on" : ""}`} role="status">
      {toastMessage}
      {toastAction && (
        <button
          className="toast-action"
          onClick={() => {
            toastAction.run();
            toast("Restored");
          }}
        >
          {toastAction.label}
        </button>
      )}
    </div>
  );
}
