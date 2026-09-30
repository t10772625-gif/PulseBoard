"use client";
import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore, health, isBlocked } from "@/lib/store";
import { dateForOffset, TODAY } from "@/lib/mock-data";
import { eisenhower, parseQuery, workloadReport } from "@/lib/ai";
import { MemberId, ProjectId, Status, Task, View } from "@/types";
import { Avatar, DueLabel, Ecg, EmptyState, HealthBreakdown, PriorityTag } from "@/components/ui";
import TaskCard from "@/components/TaskCard";
import Dropdown from "@/components/Dropdown";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import BulkBar from "@/components/BulkBar";
import BoardMenu from "@/components/BoardMenu";
import Gate, { PlanTag } from "@/components/Gate";

const VIEWS: { id: View; label: string; feature?: string }[] = [
  { id: "board", label: "Board" },
  { id: "list", label: "List" },
  { id: "time", label: "Timeline", feature: "VIEW-05" },
  { id: "calendar", label: "Calendar", feature: "VIEW-04" },
  { id: "workload", label: "Workload", feature: "VIEW-06" },
  { id: "matrix", label: "Priority matrix", feature: "AI-24" },
];

function QuickAdd({ projectId, status }: { projectId: ProjectId; status: Status }) {
  const { createTask, toast } = useStore();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button className="quick-add" onClick={() => setOpen(true)}>
        ＋ Add task
      </button>
    );
  return (
    <input
      autoFocus
      className="quick-input"
      placeholder="Task title, then Enter"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => !text && setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "Enter" && text.trim()) {
          createTask({ projectId, status, title: text.trim() });
          toast("Task added");
          setText("");
        }
      }}
    />
  );
}

export default function ProjectBoard() {
  const { id } = useParams<{ id: ProjectId }>();
  const router = useRouter();
  const store = useStore();
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
    selectedIds,
    setSelection,
    clearSelection,
    savedFilters,
    saveFilter,
    can,
    canEdit,
    allowed,
  } = store;
  const boardRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentProjectId(id);
    clearSelection();
  }, [id, setCurrentProjectId, clearSelection]);

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

  const parsed = useMemo(() => parseQuery(query, members), [query, members]);

  const project = projects[id];
  if (!project)
    return (
      <div className="card">
        <EmptyState
          title="Project not found"
          message="It may have been deleted, or you don't have access to it."
          action={
            <button className="btn" onClick={() => router.push("/projects")}>
              Go to Projects
            </button>
          }
        />
      </div>
    );
  const h = health(id, tasks);
  const columns = getColumns(id);
  const view = VIEWS.find((v) => v.id === boardView)?.feature && !can(VIEWS.find((v) => v.id === boardView)!.feature!) ? "board" : boardView;

  const filtered = tasks
    .filter((t) => t.projectId === id)
    .filter((t) => !boardFilters.mine || t.assignee === "me")
    .filter((t) => !boardFilters.high || t.priority === "h")
    .filter((t) => !boardFilters.blk || isBlocked(t, tasks))
    .filter((t) => boardFilters.assignees.length === 0 || boardFilters.assignees.includes(t.assignee))
    .filter((t) => parsed.match(t, tasks));

  function dropOnColumn(status: Status, e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.classList.remove("over");
    if (!canEdit) return toast("Your role can't move tasks");
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

  const allVisibleSelected = filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id));

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
          {!store.realMode && (
            <>
              <span className="stack">
                <Avatar id="ak" ring />
                <Avatar id="ba" ring />
              </span>
              <span className="pres" style={{ margin: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ECC71" }}></span>2 viewing
              </span>
            </>
          )}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <HealthBreakdown health={h} prefix={`Why ${h.score}?`} />
      </div>

      <div className="tool">
        <div className="tabs">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={view === v.id ? "on" : ""}
              onClick={() => (v.feature && !can(v.feature) ? toast(`${v.label} view needs an upgrade`) : setBoardView(v.id))}
            >
              {v.label}
              {v.feature && !can(v.feature) && " 🔒"}
            </button>
          ))}
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
        <button className="ghost" onClick={() => setMenuOpen(true)}>
          ⋯ Import / templates
        </button>
        {view === "board" && allowed("project.manage") && (
          <button className="ghost" onClick={() => openAddColumnModal(id)}>
            ＋ Add column
          </button>
        )}
      </div>

      <div className="tool" style={{ marginTop: -6 }}>
        {can("VIEW-11") ? (
          <input
            className="search-q"
            placeholder='Search: "my high tasks due tomorrow", "overdue", "#bug", assignee = me AND priority = high'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        ) : (
          <span className="mute" style={{ fontSize: 13 }}>
            Smart search <Gate id="VIEW-11" compact>
              {null}
            </Gate>
          </span>
        )}
        {can("VIEW-10") && (
          <>
            <Dropdown
              value=""
              onChange={(v: string) => v && setQuery(savedFilters.find((f) => f.id === v)?.query ?? "")}
              options={[{ value: "", label: "Saved filters" }, ...savedFilters.map((f) => ({ value: f.id, label: f.name }))]}
            />
            {query && (
              <button
                className="ghost"
                onClick={() => {
                  const name = window.prompt("Name this filter", query);
                  if (name) {
                    saveFilter(name, query);
                    toast("Filter saved");
                  }
                }}
              >
                ☆ Save filter
              </button>
            )}
          </>
        )}
        {canEdit && (
          <button className="ghost" onClick={() => (allVisibleSelected ? clearSelection() : setSelection(filtered.map((t) => t.id)))}>
            {allVisibleSelected ? "Clear selection" : `Select all (${filtered.length})`}
          </button>
        )}
      </div>
      {query && parsed.explain.length > 0 && (
        <p className="mute" style={{ fontSize: 12, margin: "-4px 0 10px" }}>
          Showing {filtered.length} task(s) where {parsed.explain.join(" AND ")}
        </p>
      )}

      <BulkBar projectId={id} />

      {view === "board" && (
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
                    {allowed("task.create") && (
                      <button className="ic" style={{ width: 26, height: 26 }} aria-label={`Add task to ${label}`} onClick={() => openNewTaskModal(id, status)}>
                        ＋
                      </button>
                    )}
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
                  {allowed("task.create") && <QuickAdd projectId={id} status={status} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <div className="card" style={{ padding: 8, overflowX: "auto" }}>
          <table className="tbl">
            <tbody>
              <tr>
                {canEdit && <th style={{ width: 28 }}></th>}
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
              </tr>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => openDrawer(t.id)}>
                  {canEdit && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" aria-label={`Select ${t.title}`} checked={selectedIds.includes(t.id)} onChange={() => store.toggleSelect(t.id)} />
                    </td>
                  )}
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

      {view === "time" && (
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

      {view === "calendar" && <CalendarView tasks={filtered} />}
      {view === "workload" && <WorkloadView projectTasks={filtered} />}
      {view === "matrix" && <MatrixView tasks={filtered} />}

      {menuOpen && <BoardMenu projectId={id} onClose={() => setMenuOpen(false)} />}
      <p className="mute" style={{ fontSize: 12, marginTop: 14 }}>
        Tip: press <kbd>?</kbd> for keyboard shortcuts. Plans: Timeline/Calendar <PlanTag id="VIEW-04" />, Workload <PlanTag id="VIEW-06" />.
      </p>
    </>
  );
}

// VIEW-04: month grid of due dates
function CalendarView({ tasks }: { tasks: Task[] }) {
  const { openDrawer, projects } = useStore();
  const first = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const startOffset = Math.round((first.getTime() - TODAY.getTime()) / 86400000) - ((first.getDay() + 6) % 7);
  const days = Array.from({ length: 42 }, (_, i) => startOffset + i);
  return (
    <div className="card cal">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
        <b key={d} className="cal-h">
          {d}
        </b>
      ))}
      {days.map((off) => {
        const d = new Date(TODAY);
        d.setDate(d.getDate() + off);
        const dayTasks = tasks.filter((t) => t.dueOffset === off);
        return (
          <div key={off} className={`cal-d ${off === 0 ? "today" : ""} ${d.getMonth() !== TODAY.getMonth() ? "dim" : ""}`}>
            <span className="cal-n">{d.getDate()}</span>
            {dayTasks.map((t) => (
              <button key={t.id} className="cal-t" style={{ borderLeftColor: projects[t.projectId].color }} onClick={() => openDrawer(t.id)} title={t.title}>
                {t.status === "done" ? "✓ " : ""}
                {t.title}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// VIEW-06 + AI-02: capacity bars and rebalancing suggestions
function WorkloadView({ projectTasks }: { projectTasks: Task[] }) {
  const { tasks, members, capacity, history, setTaskField, toast, openDrawer } = useStore();
  const report = workloadReport(tasks, members, capacity, history);
  return (
    <div className="grid g2">
      <div className="card">
        <h2>Open tasks vs capacity</h2>
        {report.rows.map((r) => (
          <div key={r.member} className="wl-row">
            <Avatar id={r.member} />
            <span style={{ width: 110 }}>{members[r.member].name}</span>
            <div className="wl-bar">
              <i style={{ width: `${Math.min(100, r.utilization)}%`, background: r.utilization > 100 ? "var(--bad)" : r.utilization > 80 ? "var(--warn)" : "var(--acc)" }} />
            </div>
            <b style={{ width: 60, textAlign: "right", color: r.utilization > 100 ? "var(--bad)" : undefined }}>
              {r.open}/{r.capacity}
            </b>
          </div>
        ))}
        <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>
          {projectTasks.length} tasks in this board. Capacity is set per person on the Team page.
        </p>
      </div>
      <div className="card">
        <h2>Suggested rebalancing</h2>
        <Gate id="AI-02">
          {report.suggestions.length ? (
            report.suggestions.map((s) => {
              const t = tasks.find((x) => x.id === s.taskId)!;
              return (
                <div key={s.taskId} className="sugg">
                  <button className="link" onClick={() => openDrawer(t.id)}>
                    {t.title}
                  </button>
                  <p className="mute" style={{ fontSize: 12 }}>
                    {members[s.from].name} → {members[s.to].name}. {s.reason}
                  </p>
                  <button
                    className="btn sm"
                    onClick={() => {
                      setTaskField(t.id, "assignee", s.to);
                      toast(`Moved to ${members[s.to].name}`);
                    }}
                  >
                    Apply
                  </button>
                </div>
              );
            })
          ) : (
            <p className="mute">Everyone is within capacity.</p>
          )}
        </Gate>
      </div>
    </div>
  );
}

// AI-24: Eisenhower matrix
function MatrixView({ tasks }: { tasks: Task[] }) {
  const { openDrawer } = useStore();
  const m = eisenhower(tasks);
  const cells: [string, string, Task[]][] = [
    ["Do now", "Urgent + important", m.doNow],
    ["Schedule", "Important, not urgent", m.schedule],
    ["Delegate", "Urgent, not important", m.delegate],
    ["Eliminate", "Neither", m.eliminate],
  ];
  return (
    <div className="grid g2">
      {cells.map(([title, sub, list]) => (
        <div key={title} className="card">
          <div className="meta">
            <h2 style={{ margin: 0 }}>{title}</h2>
            <span className="mute">{sub}</span>
          </div>
          {list.length ? (
            list.map((t) => (
              <button key={t.id} className="row" onClick={() => openDrawer(t.id)}>
                <span>{t.title}</span>
                <DueLabel task={t} />
              </button>
            ))
          ) : (
            <p className="mute">Nothing here.</p>
          )}
        </div>
      ))}
    </div>
  );
}
