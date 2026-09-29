"use client";
import { DragEvent, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore, health, isBlocked } from "@/lib/store";
import { dateForOffset } from "@/lib/mock-data";
import { MemberId, ProjectId, Status } from "@/types";
import { Avatar, DueLabel, Ecg, HealthBreakdown, PriorityTag } from "@/components/ui";
import TaskCard from "@/components/TaskCard";
import Dropdown from "@/components/Dropdown";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";

export default function ProjectBoard() {
  const { id } = useParams<{ id: ProjectId }>();
  const router = useRouter();
  const {
    tasks,
    setTaskField,
    toast,
    openDrawer,
    setCurrentProjectId,
    boardView,
    setBoardView,
    boardFilters,
    toggleBoardFilter,
    toggleAssigneeFilter,
    clearAssigneeFilter,
    projects,
    members,
    openNewTaskModal,
    getColumns,
    columnLabel,
    openAddColumnModal,
  } = useStore();
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentProjectId(id);
  }, [id, setCurrentProjectId]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      // If the wheel is over a column that still has room to scroll vertically,
      // let that column scroll normally instead of hijacking it for the board.
      const colBody = (e.target as HTMLElement).closest(".col-body") as HTMLElement | null;
      if (colBody) {
        const canScrollDown = e.deltaY > 0 && colBody.scrollTop + colBody.clientHeight < colBody.scrollHeight - 1;
        const canScrollUp = e.deltaY < 0 && colBody.scrollTop > 0;
        if (canScrollDown || canScrollUp) return;
      }
      e.preventDefault();
      el!.scrollLeft += e.deltaY;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [boardView]);

  const project = projects[id];
  if (!project) return <p>Project not found.</p>;
  const h = health(id, tasks);
  const columns = getColumns(id);

  const filtered = tasks
    .filter((t) => t.projectId === id)
    .filter((t) => !boardFilters.mine || t.assignee === "me")
    .filter((t) => !boardFilters.high || t.priority === "h")
    .filter((t) => !boardFilters.blk || isBlocked(t, tasks))
    .filter((t) => boardFilters.assignees.length === 0 || boardFilters.assignees.includes(t.assignee));

  function dropOnColumn(status: Status, e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.classList.remove("over");
    const taskId = e.dataTransfer.getData("text/plain");
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (status === "done" && isBlocked(task, tasks)) {
      const blocker = tasks.find((t) => t.id === task.blockedBy);
      toast(`🔒 Blocked by "${blocker?.title}". Finish it first.`);
      return;
    }
    setTaskField(taskId, "status", status);
    toast("Moved to " + columnLabel(id, status));
  }

  return (
    <>
      <div className="top">
        <div>
          <p className="mute">Project</p>
          <Dropdown
            value={id}
            onChange={(v) => router.push(`/projects/${v}`)}
            options={(Object.keys(projects) as ProjectId[]).map((k) => ({ value: k, label: projects[k].name }))}
            style={{ minWidth: 200 }}
            triggerStyle={{ fontSize: 22, fontWeight: 800, border: 0, padding: 0, background: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 110 }} title="Project health">
            <Ecg score={h.score} color={h.color} height={30} critical={h.critical} />
          </div>
          <b style={{ color: h.color }}>
            {h.score} {h.label}
          </b>
          <span className="stack">
            <Avatar id="ak" ring />
            <Avatar id="ba" ring />
          </span>
          <span className="pres" style={{ margin: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ECC71" }}></span>2 viewing
          </span>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <HealthBreakdown health={h} prefix={`Why ${h.score}?`} />
      </div>

      <div className="tool">
        <div className="tabs">
          <button className={boardView === "board" ? "on" : ""} onClick={() => setBoardView("board")}>
            Board
          </button>
          <button className={boardView === "list" ? "on" : ""} onClick={() => setBoardView("list")}>
            List
          </button>
          <button className={boardView === "time" ? "on" : ""} onClick={() => setBoardView("time")}>
            Timeline
          </button>
        </div>
        <button className={`ghost ${boardFilters.mine ? "on" : ""}`} onClick={() => toggleBoardFilter("mine")}>
          Only mine
        </button>
        <button className={`ghost ${boardFilters.high ? "on" : ""}`} onClick={() => toggleBoardFilter("high")}>
          High priority
        </button>
        <button className={`ghost ${boardFilters.blk ? "on" : ""}`} onClick={() => toggleBoardFilter("blk")}>
          🔒 Blocked
        </button>
        <MultiSelectDropdown
          placeholder="Assignees"
          values={boardFilters.assignees}
          onToggle={toggleAssigneeFilter}
          onClear={clearAssigneeFilter}
          options={(Object.keys(members) as MemberId[]).map((k) => ({ value: k, label: members[k].name }))}
        />
        <span className="grow"></span>
        {boardView === "board" && (
          <button className="ghost" onClick={() => openAddColumnModal(id)}>
            ＋ Add column
          </button>
        )}
      </div>

      {boardView === "board" && (
        <div className="board" ref={boardRef}>
          {columns.map(([status, label, limit]) => {
            const total = tasks.filter((t) => t.projectId === id && t.status === status).length;
            const over = limit > 0 && total > limit;
            const colTasks = filtered.filter((t) => t.status === status);
            return (
              <div
                key={status}
                className="col"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("over");
                }}
                onDragLeave={(e) => e.currentTarget.classList.remove("over")}
                onDrop={(e) => dropOnColumn(status, e)}
              >
                <h3>
                  {label}
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span
                      className={`wip ${over ? "x" : ""}`}
                      title={over ? `${total} tasks here, over the ${limit}-task work-in-progress limit` : limit ? `WIP limit: ${limit}` : undefined}
                    >
                      {total}
                      {limit ? ` / ${limit}` : ""}
                    </span>
                    <button className="ic" style={{ width: 26, height: 26 }} aria-label={`Add task to ${label}`} onClick={() => openNewTaskModal(id, status)}>
                      ＋
                    </button>
                  </span>
                </h3>
                <div className="col-body">
                  {colTasks.length ? (
                    colTasks.map((t) => <TaskCard key={t.id} task={t} />)
                  ) : (
                    <p className="mute" style={{ padding: "6px 4px" }}>
                      Drop a task here.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {boardView === "list" && (
        <div className="card" style={{ padding: 8, overflowX: "auto" }}>
          <table className="tbl">
            <tbody>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
              </tr>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => openDrawer(t.id)}>
                  <td>
                    <b>{t.title}</b>
                    {isBlocked(t, tasks) ? " 🔒" : ""}
                  </td>
                  <td>{columnLabel(id, t.status)}</td>
                  <td>
                    <PriorityTag p={t.priority} />
                  </td>
                  <td>
                    <Avatar id={t.assignee} />
                  </td>
                  <td>
                    <DueLabel task={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {boardView === "time" && (
        <div className="card tlw">
          <div className="tlg">
            <div className="tlr" style={{ cursor: "default" }}>
              <span className="mute">Task</span>
              <div className="ln" style={{ height: 30 }}>
                {[-10, -5, 0, 5, 10].map((d) => (
                  <span key={d} className="mute" style={{ position: "absolute", left: `${((d + 10) / 25) * 100}%` }}>
                    {dateForOffset(d)}
                  </span>
                ))}
              </div>
            </div>
            {filtered.map((t) => (
              <div key={t.id} className="tlr" onClick={() => openDrawer(t.id)}>
                <span style={{ fontWeight: 700, fontSize: 13, paddingRight: 8 }}>{t.title}</span>
                <div className="ln">
                  <div className="today" style={{ left: "40%" }}></div>
                  <div
                    className="bar2"
                    style={{
                      left: `${((t.barStart + 10) / 25) * 100}%`,
                      width: `${(t.lengthDays / 25) * 100}%`,
                      background: t.status === "done" ? "#9DB0BF" : isBlocked(t, tasks) ? "#E5483A" : projects[t.projectId].color,
                    }}
                  >
                    {isBlocked(t, tasks) ? "🔒 " : ""}
                    {columnLabel(id, t.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
