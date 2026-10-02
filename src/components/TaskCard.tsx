"use client";
import { DragEvent } from "react";
import { Trash2 } from "lucide-react";
import { useStore, isBlocked } from "@/lib/store";
import { Task } from "@/types";
import { Avatar, DueLabel } from "./ui";
import { taskKey } from "@/lib/task-keys";
import { useT } from "@/i18n/I18nProvider";

export default function TaskCard({ task }: { task: Task }) {
  const { tasks, taskPrefix, openDrawer, deleteTask, selectedIds, toggleSelect, canEdit, allowed } = useStore();
  const key = taskKey(task, taskPrefix);
  const { t: tt } = useT();
  const blocked = isBlocked(task, tasks);
  const doneSubs = task.subtasks.filter((s) => s[1]).length;
  const subtaskIcon = doneSubs === 0 ? "☐" : doneSubs === task.subtasks.length ? "☑" : "◐";
  const showProgress = task.status === "prog" && task.subtasks.length > 0;
  const selected = selectedIds.includes(task.id);
  const checklist = task.checklist ?? [];

  function onDragStart(e: DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData("text/plain", task.id);
    e.currentTarget.classList.add("dragging");
  }
  function onDragEnd(e: DragEvent<HTMLDivElement>) {
    e.currentTarget.classList.remove("dragging");
  }

  return (
    <div
      className={`task ${task.priority} ${selected ? "sel" : ""} ${selectedIds.length ? "selecting" : ""}`}
      draggable={canEdit}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => (e.shiftKey || selectedIds.length ? toggleSelect(task.id) : openDrawer(task.id))}
    >
      <div className="meta">
        <div className="lb">
          {canEdit && (
            <input
              type="checkbox"
              className="task-check"
              aria-label={tt("card.select", { title: task.title })}
              checked={selected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => toggleSelect(task.id)}
            />
          )}
          {key && <b className="task-key">{key}</b>}
          {task.labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        {allowed("task.delete") && (
          <button
            className="task-delete"
            aria-label={tt("card.delete", { title: task.title })}
            title={tt("card.deleteTitle")}
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <p>{task.title}</p>
      {showProgress && (
        <div className="sp">
          <i style={{ width: `${(doneSubs / task.subtasks.length) * 100}%` }} />
        </div>
      )}
      <div className="meta">
        <span>
          <DueLabel task={task} />{" "}
          {showProgress && (
            <span className="due">
              {subtaskIcon} {doneSubs}/{task.subtasks.length}
            </span>
          )}
          {checklist.length > 0 && (
            <span className="due" title={tt("card.checklist")}>
              ✔ {checklist.filter((c) => c[1]).length}/{checklist.length}
            </span>
          )}
          {task.recurrence && task.recurrence !== "none" && (
            <span className="due" title={tt("card.repeats", { when: tt(`drawer.${task.recurrence}`) })}>
              🔁
            </span>
          )}
          {task.energy && (
            <span className="due" title={task.energy === "high" ? tt("card.energyHigh") : tt("card.energyLow")}>
              {task.energy === "high" ? "⚡" : "🌙"}
            </span>
          )}
          {task.approval === "requested" && <span className="due" title={tt("card.waitingApproval")}>{tt("card.approval")}</span>}
          {blocked && <span className="lock"> {tt("card.blocked")}</span>}
        </span>
        <Avatar id={task.assignee} />
      </div>
    </div>
  );
}
