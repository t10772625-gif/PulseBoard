"use client";
import { FormEvent, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import Modal from "./Modal";

export default function AddColumnModal() {
  const { addColumnProjectId, closeAddColumnModal, addColumn, moveColumn, renameColumn, setColumnLimit, deleteColumn, getColumns, toast } =
    useStore();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");

  if (!addColumnProjectId) return null;
  const projectId = addColumnProjectId;
  const columns = getColumns(projectId);

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return toast("Enter a column name first");
    addColumn(projectId, v, Number(limit) || 0);
    toast(`Column "${v}" added`);
    setName("");
    setLimit("");
  }

  return (
    <Modal title="Manage columns" onClose={closeAddColumnModal}>
      <div style={{ display: "grid", gap: 8 }}>
        {columns.map(([status, label, colLimit], i) => (
          <div key={status} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <button className="col-move" disabled={i === 0} aria-label={`Move ${label} up`} onClick={() => moveColumn(projectId, status, -1)}>
                <ChevronUp size={14} />
              </button>
              <button
                className="col-move"
                disabled={i === columns.length - 1}
                aria-label={`Move ${label} down`}
                onClick={() => moveColumn(projectId, status, 1)}
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <input value={label} onChange={(e) => renameColumn(projectId, status, e.target.value)} style={{ flex: 1 }} />
            <input
              type="number"
              min={0}
              value={colLimit || ""}
              placeholder="No limit"
              onChange={(e) => setColumnLimit(projectId, status, Number(e.target.value) || 0)}
              style={{ width: 90 }}
              title="WIP limit"
            />
            <button
              className="ic"
              style={{ width: 32, height: 32, flexShrink: 0 }}
              aria-label={`Delete ${label} column`}
              title="Delete column"
              onClick={() => {
                if (window.confirm(`Delete the "${label}" column?`)) deleteColumn(projectId, status);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={submit} style={{ display: "flex", gap: 8, marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New column name" style={{ flex: 1 }} />
        <input type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Limit" style={{ width: 90 }} />
        <button className="btn">Add</button>
      </form>
    </Modal>
  );
}
