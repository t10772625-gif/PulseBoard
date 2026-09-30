"use client";
import { Archive, Trash2, X } from "lucide-react";
import { useStore, isBlocked } from "@/lib/store";
import { PRIORITY_LABEL } from "@/lib/mock-data";
import { MemberId, Priority, ProjectId, Status } from "@/types";
import Dropdown from "./Dropdown";

// Bulk actions on selected tasks (CORE-04 delete, CORE-05 status, CORE-06 assign).
export default function BulkBar({ projectId }: { projectId: ProjectId }) {
  const { selectedIds, clearSelection, deleteTasks, archiveTasks, updateTasks, setTaskField, tasks, members, getColumns, toast, canEdit, allowed } = useStore();
  if (!selectedIds.length || !canEdit) return null;
  const canAssign = allowed("task.assign");
  const canArchive = allowed("task.archive");
  const canDelete = allowed("task.delete");
  const n = selectedIds.length;

  function setStatus(s: Status) {
    let skipped = 0;
    selectedIds.forEach((id) => {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      if (s === "done" && isBlocked(t, tasks)) {
        skipped++;
        return;
      }
      setTaskField(id, "status", s);
    });
    toast(`Moved ${n - skipped} task(s)` + (skipped ? `, ${skipped} blocked` : ""));
  }

  return (
    <div className="bulk" role="toolbar" aria-label="Bulk actions">
      <b>{n} selected</b>
      <Dropdown<Status | "">
        value=""
        onChange={(v) => v && setStatus(v)}
        options={[{ value: "", label: "Move to…" }, ...getColumns(projectId).map(([s, label]) => ({ value: s as Status | "", label }))]}
      />
      <Dropdown<Priority | "">
        value=""
        onChange={(v) => {
          if (!v) return;
          updateTasks(selectedIds, { priority: v }, `Ali set priority to ${PRIORITY_LABEL[v]}`);
          toast(`Priority set on ${n} task(s)`);
        }}
        options={[{ value: "", label: "Priority…" }, ...(["h", "m", "l"] as Priority[]).map((p) => ({ value: p as Priority | "", label: PRIORITY_LABEL[p] }))]}
      />
      <Dropdown<MemberId | "">
        value=""
        onChange={(v) => {
          if (!v) return;
          selectedIds.forEach((id) => setTaskField(id, "assignee", v));
          toast(`Assigned ${n} task(s) to ${members[v].name}`);
        }}
        options={[{ value: "", label: "Assign to…" }, ...(Object.keys(members) as MemberId[]).map((m) => ({ value: m as MemberId | "", label: members[m].name }))]}
        disabled={!canAssign}
      />
      {canArchive && (
        <button className="ghost" onClick={() => archiveTasks(selectedIds)}>
          <Archive size={14} /> Archive
        </button>
      )}
      {canDelete && (
        <button className="ghost danger" onClick={() => deleteTasks(selectedIds)}>
          <Trash2 size={14} /> Delete
        </button>
      )}
      <button className="ic" aria-label="Clear selection" onClick={clearSelection}>
        <X size={16} />
      </button>
    </div>
  );
}
