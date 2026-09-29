"use client";
import { DragEvent } from "react";
import { Trash2 } from "lucide-react";
import { useStore, isBlocked } from "@/lib/store";
import { Task } from "@/types";
import { Avatar, DueLabel } from "./ui";

export default function TaskCard({ task }: { task: Task }) {
  const { tasks, openDrawer, deleteTask, toast } = useStore();
  const blocked = isBlocked(task, tasks);
  const doneSubs = task.subtasks.filter((s) => s[1]).length;
  const subtaskIcon = doneSubs === 0 ? "☐" : doneSubs === task.subtasks.length ? "☑" : "◐";
  const showProgress = task.status === "prog" && task.subtasks.length > 0;

  function onDragStart(e: DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData("text/plain", task.id);
    e.currentTarget.classList.add("dragging");
  }
  function onDragEnd(e: DragEvent<HTMLDivElement>) {
    e.currentTarget.classList.remove("dragging");
  }

  function onDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    deleteTask(task.id);
    toast("Task deleted");
  }

  return (
    <div
      className={`task ${task.priority}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => openDrawer(task.id)}
    >
      <div className="meta">
        <div className="lb">
          {task.labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <button className="task-delete" aria-label={`Delete ${task.title}`} title="Delete task" onClick={onDelete}>
          <Trash2 size={14} />
        </button>
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
          {blocked && <span className="lock"> 🔒 Blocked</span>}
        </span>
        <Avatar id={task.assignee} />
      </div>
    </div>
  );
}
