"use client";
import { Archive, Trash2, X } from "lucide-react";
import { useStore, isBlocked } from "@/lib/store";
import { PRIORITY_LABEL } from "@/lib/mock-data";
import { MemberId, Priority, ProjectId, Status } from "@/types";
import Dropdown from "./Dropdown";
import { useT } from "@/i18n/I18nProvider";

// Bulk actions on selected tasks (CORE-04 delete, CORE-05 status, CORE-06 assign).
export default function BulkBar({ projectId }: { projectId: ProjectId }) {
  const { selectedIds, clearSelection, deleteTasks, archiveTasks, updateTasks, setTaskField, tasks, members, getColumns, columnLabel, toast, canEdit, allowed } = useStore();
  const { t: tt } = useT();
  if (!selectedIds.length || !canEdit) return null;
  const me = members.me?.name.split(" ")[0] ?? tt("common.you");
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
    toast(skipped ? tt("bulk.movedSkipped", { n: n - skipped, skipped }) : tt("bulk.moved", { n }));
  }

  return (
    <div className="bulk" role="toolbar" aria-label={tt("bulk.label")}>
      <b>{tt("bulk.selected", { n })}</b>
      <Dropdown<Status | "">
        value=""
        onChange={(v) => v && setStatus(v)}
        options={[{ value: "", label: tt("bulk.moveTo") }, ...getColumns(projectId).map(([s]) => ({ value: s as Status | "", label: columnLabel(projectId, s) }))]}
      />
      <Dropdown<Priority | "">
        value=""
        onChange={(v) => {
          if (!v) return;
          updateTasks(selectedIds, { priority: v }, tt("bulk.actPriority", { name: me, priority: PRIORITY_LABEL[v] }));
          toast(tt("bulk.prioritySet", { n }));
        }}
        options={[{ value: "", label: tt("bulk.priority") }, ...(["h", "m", "l"] as Priority[]).map((p) => ({ value: p as Priority | "", label: PRIORITY_LABEL[p] }))]}
      />
      <Dropdown<MemberId | "">
        value=""
        onChange={(v) => {
          if (!v) return;
          selectedIds.forEach((id) => setTaskField(id, "assignee", v));
          toast(tt("bulk.assigned", { n, name: members[v].name }));
        }}
        options={[{ value: "", label: tt("bulk.assignTo") }, ...(Object.keys(members) as MemberId[]).map((m) => ({ value: m as MemberId | "", label: members[m].name }))]}
        disabled={!canAssign}
      />
      {canArchive && (
        <button className="ghost" onClick={() => archiveTasks(selectedIds)}>
          <Archive size={14} /> {tt("bulk.archive")}
        </button>
      )}
      {canDelete && (
        <button className="ghost danger" onClick={() => deleteTasks(selectedIds)}>
          <Trash2 size={14} /> {tt("bulk.delete")}
        </button>
      )}
      <button className="ic" aria-label={tt("bulk.clear")} onClick={clearSelection}>
        <X size={16} />
      </button>
    </div>
  );
}
