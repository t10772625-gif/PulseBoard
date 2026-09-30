"use client";
import { DragEvent } from "react";
import { Trash2 } from "lucide-react";
import { useStore, isBlocked } from "@/lib/store";
import { Task } from "@/types";
import { Avatar, DueLabel } from "./ui";

export default function TaskCard({ task }: { task: Task }) {
  const { tasks, openDrawer, deleteTask, selectedIds, toggleSelect, canEdit, allowed } = useStore();
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
              aria-label={`Select ${task.title}`}
              checked={selected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => toggleSelect(task.id)}
            />
          )}
          {task.labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        {allowed("task.delete") && (
          <button
            className="task-delete"
            aria-label={`Delete ${task.title}`}
            title="Delete task (undo available)"
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
            <span className="due" title="Checklist">
              ✔ {checklist.filter((c) => c[1]).length}/{checklist.length}
            </span>
          )}
          {task.recurrence && task.recurrence !== "none" && (
            <span className="due" title={`Repeats ${task.recurrence}`}>
              🔁
            </span>
          )}
          {task.energy && (
            <span className="due" title={`${task.energy} energy`}>
              {task.energy === "high" ? "⚡" : "🌙"}
            </span>
          )}
          {task.approval === "requested" && <span className="due" title="Waiting for client approval">⏳ Approval</span>}
          {blocked && <span className="lock"> 🔒 Blocked</span>}
        </span>
        <Avatar id={task.assignee} />
      </div>
    </div>
  );
}
