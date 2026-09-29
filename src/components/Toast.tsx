"use client";
import { useStore } from "@/lib/store";

export default function Toast() {
  const { toastMessage } = useStore();
  return (
    <div className={`toast ${toastMessage ? "on" : ""}`} role="status">
      {toastMessage}
    </div>
  );
}
