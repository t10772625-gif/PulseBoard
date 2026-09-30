"use client";
import { useState } from "react";
import { Archive, Camera, Copy, Crosshair, Link2, Sparkles, Trash2 } from "lucide-react";
import { useStore, isBlocked, liveTrackedSeconds } from "@/lib/store";
import { useTick } from "@/lib/useTick";
import { PRIORITY_LABEL, TODAY, dateForOffset, formatDuration, offsetForDate } from "@/lib/mock-data";
import { autoDoc, autoPriority, autoTags, estimateFor, findDuplicates, predictCompletion, smartMatch, splitTask, taskModule, testCases } from "@/lib/ai";
import { Comment, Energy, MemberId, Priority, Recurrence, Status, Task } from "@/types";
import { Avatar, Switch } from "./ui";
import Dropdown from "./Dropdown";
import Gate from "./Gate";

function activityIcon(message: string) {
  if (message.includes("commented") || message.includes("replied")) return "💬";
  if (message.includes("moved")) return "🔀";
  if (message.includes("priority")) return "⚑";
  if (message.includes("reassigned")) return "👤";
  if (message.includes("tracked")) return "⏱";
  if (message.includes("marked") || message.includes("checklist")) return "☑";
  if (message.includes("created")) return "✨";
  if (message.includes("approv")) return "✅";
  return "•";
}

function isDescendantOf(comment: Comment, rootId: string, all: Comment[]): boolean {
  const seen = new Set<string>();
  let cur: Comment | undefined = comment;
  while (cur?.parentId) {
    if (seen.has(cur.id)) return false;
    seen.add(cur.id);
    if (cur.parentId === rootId) return true;
    cur = all.find((x) => x.id === cur!.parentId);
  }
  return false;
}

function CommentRow({ comment, locked, hintParentName }: { comment: Comment; locked: boolean; hintParentName?: string }) {
  const { members, toggleCommentLike, addComment } = useStore();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const liked = comment.likedBy.includes("me");

  function submitReply() {
    const text = replyText.trim();
    if (!text) return;
    addComment(comment.taskId, text, comment.id);
    setReplyText("");
    setReplying(false);
  }

  // Escape before highlighting @mentions so comment text can't inject HTML
  const safe = comment.text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

  return (
    <div className="cm">
      <Avatar id={comment.author} />
      <div className="cm-body">
        <b>{members[comment.author].name}</b> <span className="mute">{comment.at}</span>
        {hintParentName && (
          <div className="mute" style={{ fontSize: 11 }}>
            ↳ replying to {hintParentName}
          </div>
        )}
        <p dangerouslySetInnerHTML={{ __html: safe.replace(/@(\w+)/g, "<mark>@$1</mark>") }} />
        {locked ? (
          comment.likedBy.length > 0 && (
            <div className="cm-actions">
              <span className="like-btn liked">❤ {comment.likedBy.length}</span>
            </div>
          )
        ) : (
          <>
            <div className="cm-actions">
              <button className={`like-btn ${liked ? "liked" : ""}`} onClick={() => toggleCommentLike(comment.taskId, comment.id)}>
                {liked ? "❤" : "🤍"} {comment.likedBy.length > 0 ? comment.likedBy.length : ""}
              </button>
              <button className="reply-link" onClick={() => setReplying((r) => !r)}>
                Reply
              </button>
            </div>
            {replying && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${members[comment.author].name}`}
                  onKeyDown={(e) => e.key === "Enter" && submitReply()}
                />
                <button className="btn" onClick={submitReply}>
                  Reply
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CommentThread({ root, allComments, locked }: { root: Comment; allComments: Comment[]; locked: boolean }) {
  const { members } = useStore();
  // Replies can target any comment in the thread, but render flat (one indent level)
  // so deep reply chains never stair-step off the side of the drawer.
  const descendants = allComments.filter((c) => c.parentId !== null && isDescendantOf(c, root.id, allComments));

  return (
    <div>
      <CommentRow comment={root} locked={locked} />
      {descendants.length > 0 && (
        <div className="reply-wrap">
          {descendants.map((c) => {
            const parent = allComments.find((p) => p.id === c.parentId);
            const hint = parent && parent.id !== root.id ? members[parent.author].name : undefined;
            return <CommentRow key={c.id} comment={c} locked={locked} hintParentName={hint} />;
          })}
        </div>
      )}
    </div>
  );
}

// AI assist panel: every suggestion is rule-based (src/lib/ai.ts) and needs a click to apply.
function AiAssist({ task, locked }: { task: Task; locked: boolean }) {
  const { tasks, members, capacity, history, projects, setTaskField, updateTask, addSubtask, archiveTasks, addComment, openDrawer, toast, spendAi, can } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const run = (key: string) => {
    if (open === key) return setOpen(null);
    if (spendAi()) setOpen(key);
  };
  const match = open === "match" ? smartMatch(task, tasks, history, members, capacity) : null;
  const prio = open === "prio" ? autoPriority({ ...task, reports: findDuplicates(task.title, tasks, task.id).length }) : null;
  const dups = open === "dups" ? findDuplicates(task.title, tasks, task.id, 0.25) : [];
  const pred = open === "pred" ? predictCompletion(task, tasks, history) : null;

  const btn = (key: string, label: string, feature: string) => (
    <button className={`ghost sm ${open === key ? "on" : ""}`} disabled={locked && key !== "doc" && key !== "pred"} onClick={() => (can(feature) ? run(key) : toast(`${label} needs an upgrade`))}>
      {label}
      {!can(feature) && " 🔒"}
    </button>
  );

  return (
    <div className="card ai-box">
      <div className="meta" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0, display: "flex", gap: 6, alignItems: "center" }}>
          <Sparkles size={16} /> AI assist
        </h2>
        <span className="mute" style={{ fontSize: 12 }}>
          Module: {taskModule(task)}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {btn("match", "Smart match", "AI-01")}
        {btn("prio", "Auto-priority", "AI-04")}
        {btn("dups", "Duplicates", "AI-03")}
        {btn("split", "Split", "AI-23")}
        {btn("pred", "Predict", "AI-18")}
        {btn("tests", "Test cases", "AI-14")}
        {btn("doc", "Auto-doc", "AI-20")}
      </div>

      {match && (
        <div className="ai-out">
          {match.results.slice(0, 3).map((r, i) => (
            <div key={r.member} className="sugg">
              <span>
                <Avatar id={r.member} /> <b>{members[r.member].name}</b> {i === 0 && <span className="chip">best match</span>}
                <br />
                <span className="mute" style={{ fontSize: 12 }}>
                  {r.reason}
                </span>
              </span>
              <button
                className="btn sm"
                disabled={task.assignee === r.member}
                onClick={() => {
                  setTaskField(task.id, "assignee", r.member);
                  addComment(task.id, `Smart match: assigned to ${members[r.member].name} (${r.reason}, confidence ${Math.round(match.confidence * 100)}%)`);
                  toast(`Assigned to ${members[r.member].name}`);
                }}
              >
                {task.assignee === r.member ? "Assigned" : "Assign"}
              </button>
            </div>
          ))}
        </div>
      )}

      {prio && (
        <div className="ai-out">
          <p>
            Suggested: <b>{PRIORITY_LABEL[prio.priority]}</b> (score {prio.score}/10)
          </p>
          <ul className="mute" style={{ fontSize: 12, margin: "4px 0 8px 18px" }}>
            {prio.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <button className="btn sm" disabled={prio.priority === task.priority} onClick={() => setTaskField(task.id, "priority", prio.priority)}>
            {prio.priority === task.priority ? "Already set" : "Apply"}
          </button>
        </div>
      )}

      {open === "dups" && (
        <div className="ai-out">
          {dups.length ? (
            dups.map((d) => (
              <div key={d.task.id} className="sugg">
                <button className="link" onClick={() => openDrawer(d.task.id)}>
                  {d.task.title} <span className="mute">({Math.round(d.score * 100)}% match)</span>
                </button>
                <button
                  className="ghost sm"
                  onClick={() => {
                    addComment(d.task.id, `Merged duplicate "${task.title}": ${task.description || "no extra details"}`);
                    updateTask(d.task.id, { labels: Array.from(new Set([...d.task.labels, ...task.labels])) });
                    archiveTasks([task.id]);
                    openDrawer(d.task.id);
                    toast("Merged into the existing task");
                  }}
                >
                  Merge into this
                </button>
              </div>
            ))
          ) : (
            <p className="mute">No similar tasks found.</p>
          )}
        </div>
      )}

      {open === "split" && (
        <div className="ai-out">
          {splitTask(task.title).map((s) => (
            <div key={s} className="sugg">
              <span>{s}</span>
              <button className="ghost sm" onClick={() => addSubtask(task.id, s)}>
                ＋ Add
              </button>
            </div>
          ))}
        </div>
      )}

      {pred && (
        <div className="ai-out">
          <p>
            Likely done <b>{dateForOffset(pred.predictedOffset)}</b> ({Math.round(pred.confidence * 100)}% confidence) —{" "}
            <b style={{ color: pred.late ? "var(--bad)" : "var(--acc)" }}>{pred.late ? `late vs due ${dateForOffset(task.dueOffset)}` : "on time"}</b>
          </p>
          {pred.risks.length > 0 && <p className="mute" style={{ fontSize: 12 }}>Risks: {pred.risks.join("; ")}</p>}
        </div>
      )}

      {open === "tests" && (
        <div className="ai-out">
          {testCases(task.title).map((c) => (
            <p key={c} style={{ fontSize: 13 }}>
              • {c}
            </p>
          ))}
          <button
            className="ghost sm"
            onClick={() => {
              updateTask(task.id, { checklist: [...(task.checklist ?? []), ...testCases(task.title).map((c) => [c, 0] as [string, 0 | 1])] }, "Ali added AI test cases to the checklist");
              toast("Added to checklist");
            }}
          >
            Add to checklist
          </button>
        </div>
      )}

      {open === "doc" && (
        <div className="ai-out">
          <pre className="doc-pre">{autoDoc(task, projects[task.projectId].name, taskModule(task))}</pre>
          <button
            className="ghost sm"
            onClick={() => {
              navigator.clipboard?.writeText(autoDoc(task, projects[task.projectId].name, taskModule(task)));
              toast("Copied as Markdown");
            }}
          >
            Copy Markdown
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskDrawer({ taskId }: { taskId: string }) {
  const {
    tasks,
    projects,
    members,
    comments,
    activity,
    toggleSubtask,
    addSubtask,
    toggleChecklist,
    addChecklistItem,
    setTaskField,
    updateTask,
    deleteTask,
    cloneTask,
    archiveTasks,
    addComment,
    toast,
    openDrawer,
    closeDrawer,
    tracking,
    startTracking,
    pauseTracking,
    endTracking,
    attachments,
    addAttachments,
    removeAttachment,
    getColumns,
    columnLabel,
    customFields,
    createShareLink,
    setFocusTaskId,
    history,
    canEdit,
    can,
    allowed,
  } = useStore();
  const [commentText, setCommentText] = useState("");
  const [subtaskText, setSubtaskText] = useState("");
  const [checkText, setCheckText] = useState("");
  const [labelText, setLabelText] = useState("");
  const task = tasks.find((t) => t.id === taskId);
  const isTracking = tracking?.taskId === taskId;
  useTick(isTracking && tracking?.status === "running");

  if (!task) return null;

  const locked = task.status === "done" || !canEdit;
  const blocker = task.blockedBy ? tasks.find((t) => t.id === task.blockedBy) : undefined;
  const blockedActive = blocker && blocker.status !== "done";
  const taskComments = comments[taskId] || [];
  const topLevelComments = taskComments.filter((c) => c.parentId === null);
  const doneCount = task.subtasks.filter((s) => s[1]).length;
  const taskActivity = activity[taskId] || [];
  const taskFiles = attachments[taskId] || [];
  const checklist = task.checklist ?? [];
  const suggestedTags = autoTags(task.title + " " + task.description).filter((t) => !task.labels.some((l) => l.toLowerCase() === t));
  const tracked = liveTrackedSeconds(task, tracking);
  const estimate = estimateFor(task, history);
  const dueIso = (() => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() + task.dueOffset);
    return d.toISOString().slice(0, 10);
  })();

  function onStatusChange(v: Status) {
    if (v === "done" && isBlocked(task!, tasks)) {
      toast(`🔒 Blocked by "${blocker!.title}". Finish it first.`);
      return;
    }
    setTaskField(taskId, "status", v);
    toast("Moved to " + columnLabel(task!.projectId, v));
  }

  function postComment() {
    const text = commentText.trim();
    if (!text) return toast("Write a comment first");
    addComment(taskId, text);
    setCommentText("");
    toast("Comment posted");
  }

  function submitSubtask() {
    const text = subtaskText.trim();
    if (!text) return toast("Enter a subtask title first");
    addSubtask(taskId, text);
    setSubtaskText("");
  }

  function share() {
    const token = createShareLink("task", taskId);
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard?.writeText(url);
    toast("Read-only link copied");
  }

  const addLabel = (l: string) => {
    const v = l.trim();
    if (!v || task.labels.includes(v)) return;
    updateTask(taskId, { labels: [...task.labels, v] }, `Ali added label "${v}"`);
  };

  return (
    <>
      <div className="meta" style={{ marginBottom: 10 }}>
        <span className="chip" style={{ color: projects[task.projectId]?.color }}>
          {projects[task.projectId]?.name}
        </span>
        <span style={{ display: "flex", gap: 6 }}>
          <button className="ic" aria-label="Focus on this task" title="Focus mode" onClick={() => setFocusTaskId(taskId)}>
            <Crosshair size={16} />
          </button>
          {can("COL-04") && allowed("share.create") && (
            <button className="ic" aria-label="Copy share link" title="Share read-only link" onClick={share}>
              <Link2 size={16} />
            </button>
          )}
          {allowed("task.create") && (
            <>
              <button
                className="ic"
                aria-label="Duplicate task"
                title="Duplicate"
                onClick={() => {
                  const id = cloneTask(taskId);
                  if (id) {
                    openDrawer(id);
                    toast("Task duplicated");
                  }
                }}
              >
                <Copy size={16} />
              </button>
            </>
          )}
          {allowed("task.archive") && (
            <button className="ic" aria-label="Archive task" title="Archive" onClick={() => archiveTasks([taskId])}>
              <Archive size={16} />
            </button>
          )}
          {allowed("task.delete") && (
            <button className="ic" aria-label="Delete task" title="Delete (undo available)" onClick={() => deleteTask(taskId)}>
              <Trash2 size={16} />
            </button>
          )}
          <button className="ic" aria-label="Close" onClick={closeDrawer}>
            ✕
          </button>
        </span>
      </div>
      <input
        key={task.id + task.title}
        className="title-edit"
        defaultValue={task.title}
        disabled={locked}
        aria-label="Task title"
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v && v !== task.title) updateTask(taskId, { title: v }, `Ali renamed this to "${v}"`);
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />

      {task.id === "t1" && (
        <div className="pres">
          <Avatar id="ak" ring />
          Ayesha is viewing{" "}
          <span className="ty">
            is typing
            <i></i>
            <i></i>
            <i></i>
          </span>
        </div>
      )}

      {blockedActive && (
        <button className="warn" onClick={() => openDrawer(blocker!.id)}>
          🔒 Blocked by &quot;{blocker!.title}&quot;. This task cannot move to Done until that one is finished.
        </button>
      )}

      {task.status === "done" && (
        <p className="mute" style={{ marginBottom: 12 }}>
          This task is done and locked. Only status can be changed — reopen it to edit anything else.
        </p>
      )}
      {!canEdit && (
        <p className="mute" style={{ marginBottom: 12 }}>
          You&apos;re viewing as a Viewer — read only.
        </p>
      )}

      <div className="f2" style={{ marginBottom: 12 }}>
        <label>
          Status
          <Dropdown value={task.status} onChange={onStatusChange} disabled={!canEdit} options={getColumns(task.projectId).map(([s, label]) => ({ value: s, label }))} />
        </label>
        <label>
          Priority
          <Dropdown
            value={task.priority}
            onChange={(v: Priority) => setTaskField(taskId, "priority", v)}
            options={(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => ({ value: k, label: PRIORITY_LABEL[k] }))}
            disabled={locked}
          />
        </label>
        <label>
          Assignee
          <Dropdown
            value={task.assignee}
            onChange={(v: MemberId) => setTaskField(taskId, "assignee", v)}
            options={(Object.keys(members) as MemberId[]).map((k) => ({ value: k, label: members[k].name }))}
            disabled={locked || !allowed("task.assign")}
          />
        </label>
        <label>
          Due
          <input
            type="date"
            value={dueIso}
            disabled={locked}
            onChange={(e) => e.target.value && updateTask(taskId, { dueOffset: offsetForDate(e.target.value) }, `Ali set due date to ${dateForOffset(offsetForDate(e.target.value))}`)}
          />
        </label>
      </div>

      <div className="f2 f3" style={{ marginBottom: 12 }}>
        <label>
          Estimate (h)
          <input
            type="number"
            min={0}
            value={task.estimateHours ?? ""}
            placeholder={`~${estimate}h`}
            disabled={locked}
            onChange={(e) => updateTask(taskId, { estimateHours: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>
        <label>
          Energy
          <Dropdown<Energy | "">
            value={task.energy ?? ""}
            disabled={locked || !can("TIME-07")}
            onChange={(v) => updateTask(taskId, { energy: v || undefined })}
            options={[
              { value: "", label: can("TIME-07") ? "Not set" : "🔒 Legendary" },
              { value: "high", label: "⚡ High" },
              { value: "low", label: "🌙 Low" },
            ]}
          />
        </label>
        <label>
          Repeats
          <Dropdown<Recurrence>
            value={task.recurrence ?? "none"}
            disabled={locked || !can("CORE-11")}
            onChange={(v) => updateTask(taskId, { recurrence: v }, v === "none" ? "Ali stopped repeating this task" : `Ali set this to repeat ${v}`)}
            options={[
              { value: "none", label: can("CORE-11") ? "Never" : "🔒 Pro" },
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </label>
        <label>
          Blocked by
          <Dropdown<string>
            value={task.blockedBy ?? ""}
            disabled={locked || !can("CORE-12")}
            onChange={(v) => {
              if (v && tasks.find((t) => t.id === v)?.blockedBy === taskId) return toast("That would create a loop");
              updateTask(taskId, { blockedBy: v || undefined }, v ? `Ali marked this as blocked by "${tasks.find((t) => t.id === v)?.title}"` : "Ali removed the blocker");
            }}
            options={[
              { value: "", label: can("CORE-12") ? "Nothing" : "🔒 Pro" },
              ...tasks.filter((t) => t.id !== taskId && t.projectId === task.projectId).map((t) => ({ value: t.id, label: t.title })),
            ]}
          />
        </label>
        <div className="field-switch">
          <span>Billable {!can("CLI-04") && "🔒"}</span>
          <Switch label="Billable" checked={!!task.billable} disabled={locked || !can("CLI-04")} onChange={(v) => updateTask(taskId, { billable: v })} />
        </div>
      </div>

      <label style={{ marginBottom: 12 }}>
        Description
        <textarea
          key={task.id}
          rows={3}
          defaultValue={task.description}
          disabled={locked}
          onBlur={(e) => e.target.value !== task.description && updateTask(taskId, { description: e.target.value }, "Ali edited the description")}
        />
      </label>

      <div className="meta" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>Labels</h2>
      </div>
      <div className="lb" style={{ marginBottom: 6, flexWrap: "wrap" }}>
        {task.labels.map((l) => (
          <span key={l}>
            {l}
            {!locked && (
              <button className="lb-x" aria-label={`Remove ${l}`} onClick={() => updateTask(taskId, { labels: task.labels.filter((x) => x !== l) })}>
                ×
              </button>
            )}
          </span>
        ))}
        {!locked && (
          <input
            className="lb-input"
            placeholder="+ label"
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addLabel(labelText);
                setLabelText("");
              }
            }}
          />
        )}
      </div>
      {!locked && suggestedTags.length > 0 && can("AI-16") && (
        <p className="mute" style={{ fontSize: 12, marginBottom: 12 }}>
          Suggested:{" "}
          {suggestedTags.map((t) => (
            <button key={t} className="chip" style={{ marginRight: 4 }} onClick={() => addLabel(t[0].toUpperCase() + t.slice(1))}>
              + {t}
            </button>
          ))}
        </p>
      )}

      {customFields.length > 0 && (
        <Gate id="CORE-19">
          <div className="f2" style={{ marginBottom: 12 }}>
            {customFields.map((f) => (
              <label key={f.id}>
                {f.name}
                {f.type === "select" ? (
                  <Dropdown<string>
                    value={task.customFields?.[f.id] ?? ""}
                    disabled={locked}
                    onChange={(v) => updateTask(taskId, { customFields: { ...task.customFields, [f.id]: v } })}
                    options={[{ value: "", label: "—" }, ...(f.options ?? []).map((o) => ({ value: o, label: o }))]}
                  />
                ) : (
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    defaultValue={task.customFields?.[f.id] ?? ""}
                    disabled={locked}
                    onBlur={(e) => updateTask(taskId, { customFields: { ...task.customFields, [f.id]: e.target.value } })}
                  />
                )}
              </label>
            ))}
          </div>
        </Gate>
      )}

      {task.approval && task.approval !== "none" ? (
        <p className={`approval ${task.approval}`}>
          {task.approval === "requested" && "⏳ Waiting for client approval"}
          {task.approval === "approved" && "✅ Approved by the client"}
          {task.approval === "rejected" && "❌ Changes requested by the client"}
        </p>
      ) : (
        can("CLI-03") &&
        canEdit && (
          <button className="ghost sm" style={{ marginBottom: 12 }} onClick={() => updateTask(taskId, { approval: "requested" }, "Ali requested client approval")}>
            Request client approval
          </button>
        )
      )}

      <AiAssist task={task} locked={locked} />

      <div className="meta" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>Attachments</h2>
        <span className="mute">{taskFiles.length}</span>
      </div>
      <div className="attach-grid">
        {taskFiles.map((f) => (
          <div className="attach-item" key={f.id}>
            {f.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob: object URL from a local file, next/image can't optimize these
              <img src={f.url} alt={f.name} />
            ) : (
              <video src={f.url} muted />
            )}
            {!locked && (
              <button className="attach-remove" aria-label={`Remove ${f.name}`} onClick={() => removeAttachment(taskId, f.id)}>
                ✕
              </button>
            )}
          </div>
        ))}
        {!locked && (
          <>
            <label className="attach-add" title="Upload files">
              ＋
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files) addAttachments(taskId, e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <label className="attach-add" title="Take a photo (mobile)">
              <Camera size={18} />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files) addAttachments(taskId, e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </>
        )}
      </div>

      <div className="meta" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>Subtasks</h2>
        <span className="mute">
          {doneCount}/{task.subtasks.length}
        </span>
      </div>
      {task.subtasks.length ? (
        task.subtasks.map((s, i) => (
          <label key={i} className={`sub ${s[1] ? "dn" : ""}`} style={{ display: "flex" }}>
            <input type="checkbox" checked={!!s[1]} disabled={locked} onChange={() => toggleSubtask(taskId, i)} />
            <span>{s[0]}</span>
          </label>
        ))
      ) : (
        <p className="mute">No subtasks yet.</p>
      )}
      {!locked && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 16 }}>
          <input placeholder="Add a subtask" value={subtaskText} onChange={(e) => setSubtaskText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitSubtask()} />
          <button className="ghost" onClick={submitSubtask}>
            Add
          </button>
        </div>
      )}

      <div className="meta" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>Checklist</h2>
        <span className="mute">
          {checklist.filter((c) => c[1]).length}/{checklist.length}
        </span>
      </div>
      {checklist.map((s, i) => (
        <label key={i} className={`sub ${s[1] ? "dn" : ""}`} style={{ display: "flex" }}>
          <input type="checkbox" checked={!!s[1]} disabled={locked} onChange={() => toggleChecklist(taskId, i)} />
          <span>{s[0]}</span>
        </label>
      ))}
      {!locked && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 16 }}>
          <input
            placeholder="Add a checklist item"
            value={checkText}
            onChange={(e) => setCheckText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && checkText.trim()) {
                addChecklistItem(taskId, checkText.trim());
                setCheckText("");
              }
            }}
          />
          <button
            className="ghost"
            onClick={() => {
              if (!checkText.trim()) return;
              addChecklistItem(taskId, checkText.trim());
              setCheckText("");
            }}
          >
            Add
          </button>
        </div>
      )}

      <Gate id="TIME-01">
        {(task.status === "prog" || tracked > 0) && (
          <div
            className="card"
            style={{ margin: "16px 0", padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}
          >
            <span>
              <b>{formatDuration(tracked)}</b> tracked
              <br />
              <span className="mute" style={{ color: tracked / 3600 > estimate ? "var(--bad)" : undefined }}>
                of {estimate}h estimated
                {tracked > 0 && ` · ${Math.round((tracked / 3600 / Math.max(estimate, 0.1)) * 100)}% used`}
              </span>
            </span>
            {task.status === "prog" && canEdit && (
              <div style={{ display: "flex", gap: 8 }}>
                {!isTracking && (
                  <button className="btn" onClick={() => startTracking(taskId)}>
                    ▶ Start
                  </button>
                )}
                {isTracking && tracking!.status === "running" && (
                  <button className="ghost" onClick={pauseTracking}>
                    ⏸ Pause
                  </button>
                )}
                {isTracking && tracking!.status === "paused" && (
                  <button className="btn" onClick={() => startTracking(taskId)}>
                    ▶ Resume
                  </button>
                )}
                {isTracking && (
                  <button className="ghost" onClick={endTracking}>
                    ⏹ End
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Gate>

      <h2>Comments</h2>
      {topLevelComments.length ? (
        topLevelComments.map((c) => <CommentThread key={c.id} root={c} allComments={taskComments} locked={locked} />)
      ) : (
        <p className="mute" style={{ marginBottom: 12 }}>
          No comments yet. Start the conversation.
        </p>
      )}
      {task.status !== "done" && allowed("comment.create") && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input placeholder="Write a comment, use @ to mention" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && postComment()} />
          <button className="btn" onClick={postComment}>
            Post
          </button>
        </div>
      )}

      <h2>Activity</h2>
      <div className="tl">
        {taskActivity.map((ev) => (
          <p key={ev.id} className="act-item">
            <span className="ico">{activityIcon(ev.message)}</span>
            <span>
              {ev.message}
              {ev.at && <span className="mute"> · {ev.at}</span>}
            </span>
          </p>
        ))}
      </div>
    </>
  );
}
