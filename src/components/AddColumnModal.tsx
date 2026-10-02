"use client";
import { FormEvent, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import Modal from "./Modal";
import FieldError, { invalid } from "./FieldError";
import { v, type FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

export default function AddColumnModal() {
  const { addColumnProjectId, closeAddColumnModal, addColumn, moveColumn, renameColumn, setColumnLimit, deleteColumn, getColumns, toast } =
    useStore();
  const { t: tt } = useT();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [nameErr, setNameErr] = useState<FieldMsg>(null);

  if (!addColumnProjectId) return null;
  const projectId = addColumnProjectId;
  const columns = getColumns(projectId);

  function submit(e: FormEvent) {
    e.preventDefault();
    const problem = v.text(name, 1, 40) ?? (Number(limit) < 0 || Number(limit) > 999 ? ({ key: "v.range", values: { min: 0, max: 999 } } as FieldMsg) : null);
    setNameErr(problem);
    if (problem) return;
    const clean = name.trim();
    addColumn(projectId, clean, Number(limit) || 0);
    toast(tt("columns.added", { name: clean }));
    setName("");
    setLimit("");
  }

  return (
    <Modal title={tt("columns.title")} onClose={closeAddColumnModal}>
      <div style={{ display: "grid", gap: 8 }}>
        {columns.map(([status, label, colLimit], i) => (
          <div key={status} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <button className="col-move" disabled={i === 0} aria-label={tt("columns.moveUp", { name: label })} onClick={() => moveColumn(projectId, status, -1)}>
                <ChevronUp size={14} />
              </button>
              <button
                className="col-move"
                disabled={i === columns.length - 1}
                aria-label={tt("columns.moveDown", { name: label })}
                onClick={() => moveColumn(projectId, status, 1)}
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <input value={label} maxLength={40} placeholder={tt("columns.newName")} aria-label={tt("columns.rename", { name: label })} onChange={(e) => renameColumn(projectId, status, e.target.value)} style={{ flex: 1 }} />
            <input
              type="number"
              min={0}
              value={colLimit || ""}
              placeholder={tt("columns.noLimit")}
              onChange={(e) => setColumnLimit(projectId, status, Number(e.target.value) || 0)}
              style={{ width: 90 }}
              title={tt("columns.wipLimit")}
            />
            <button
              className="ic"
              style={{ width: 32, height: 32, flexShrink: 0 }}
              aria-label={tt("columns.deleteAria", { name: label })}
              title={tt("columns.delete")}
              onClick={() => {
                if (window.confirm(tt("columns.deleteConfirm", { name: label }))) deleteColumn(projectId, status);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={submit} noValidate style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={name} maxLength={40} onChange={(e) => (setName(e.target.value), setNameErr(null))} placeholder={tt("columns.newName")} style={{ flex: 1 }} {...invalid("err-col", nameErr)} />
          <input type="number" min={0} max={999} value={limit} onChange={(e) => (setLimit(e.target.value), setNameErr(null))} placeholder={tt("columns.limit")} style={{ width: 90 }} aria-label={tt("columns.limit")} />
          <button className="btn">{tt("common.add")}</button>
        </div>
        <FieldError id="err-col" msg={nameErr} />
      </form>
    </Modal>
  );
}
