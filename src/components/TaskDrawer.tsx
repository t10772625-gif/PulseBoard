"use client";
import { useState } from "react";
import { Archive, Camera, Copy, Crosshair, Link2, Sparkles, Trash2 } from "lucide-react";
import { useStore, isBlocked, liveTrackedSeconds } from "@/lib/store";
import { useTick } from "@/lib/useTick";
import { PRIORITY_LABEL, TODAY, dateForOffset, formatDuration, offsetForDate } from "@/lib/mock-data";
import { autoDoc, autoPriority, autoTags, estimateFor, findDuplicates, moduleName, predictCompletion, smartMatch, splitTask, taskModule, testCases } from "@/lib/ai";
import { Comment, Energy, MemberId, Priority, Recurrence, Status, Task } from "@/types";
import { Avatar, Switch } from "./ui";
import Dropdown from "./Dropdown";
import Gate from "./Gate";
import { useT } from "@/i18n/I18nProvider";

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
  const { t: tt } = useT();
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
            {tt("drawer.replyingTo", { name: hintParentName })}
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
                {tt("drawer.reply")}
              </button>
            </div>
            {replying && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={tt("drawer.replyTo", { name: members[comment.author].name })}
                  onKeyDown={(e) => e.key === "Enter" && submitReply()}
                />
                <button className="btn" onClick={submitReply}>
                  {tt("drawer.reply")}
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
  const { t: tt, rich } = useT();
  const me = members.me?.name.split(" ")[0] ?? tt("common.you");
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
    <button className={`ghost sm ${open === key ? "on" : ""}`} disabled={locked && key !== "doc" && key !== "pred"} onClick={() => (can(feature) ? run(key) : toast(tt("drawer.needsUpgrade", { feature: label })))}>
      {label}
      {!can(feature) && " 🔒"}
    </button>
  );

  return (
    <div className="card ai-box">
      <div className="meta" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0, display: "flex", gap: 6, alignItems: "center" }}>
          <Sparkles size={16} /> {tt("drawer.aiAssist")}
        </h2>
        <span className="mute" style={{ fontSize: 12 }}>
          {tt("drawer.module", { module: moduleName(taskModule(task)) })}
        </span>
      </div>
      <p className="mute" style={{ fontSize: 12, margin: "-4px 0 8px" }}>
        {tt("drawer.aiRuleBased")}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {btn("match", tt("drawer.btnMatch"), "AI-01")}
        {btn("prio", tt("drawer.btnPrio"), "AI-04")}
        {btn("dups", tt("drawer.btnDups"), "AI-03")}
        {btn("split", tt("drawer.btnSplit"), "AI-23")}
        {btn("pred", tt("drawer.btnPred"), "AI-18")}
        {btn("tests", tt("drawer.btnTests"), "AI-14")}
        {btn("doc", tt("drawer.btnDoc"), "AI-20")}
      </div>

      {match && (
        <div className="ai-out">
          {match.results.slice(0, 3).map((r, i) => (
            <div key={r.member} className="sugg">
              <span>
                <Avatar id={r.member} /> <b>{members[r.member].name}</b> {i === 0 && <span className="chip">{tt("drawer.bestMatch")}</span>}
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
                  addComment(task.id, tt("drawer.matchComment", { name: members[r.member].name, reason: r.reason, pct: Math.round(match.confidence * 100) }));
                  toast(tt("drawer.assignedTo", { name: members[r.member].name }));
                }}
              >
                {task.assignee === r.member ? tt("drawer.assigned") : tt("drawer.assign")}
              </button>
            </div>
          ))}
        </div>
      )}

      {prio && (
        <div className="ai-out">
          <p>{rich("drawer.suggested", { priority: PRIORITY_LABEL[prio.priority], score: prio.score })}</p>
          <ul className="mute" style={{ fontSize: 12, margin: 0, marginBlock: "4px 8px", paddingInlineStart: 18 }}>
            {prio.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <button className="btn sm" disabled={prio.priority === task.priority} onClick={() => setTaskField(task.id, "priority", prio.priority)}>
            {prio.priority === task.priority ? tt("drawer.alreadySet") : tt("common.apply")}
          </button>
        </div>
      )}

      {open === "dups" && (
        <div className="ai-out">
          {dups.length ? (
            dups.map((d) => (
              <div key={d.task.id} className="sugg">
                <button className="link" onClick={() => openDrawer(d.task.id)}>
                  {d.task.title} <span className="mute">{tt("drawer.matchPct", { pct: Math.round(d.score * 100) })}</span>
                </button>
                <button
                  className="ghost sm"
                  onClick={() => {
                    addComment(d.task.id, tt("drawer.mergedComment", { title: task.title, details: task.description || tt("drawer.noExtraDetails") }));
                    updateTask(d.task.id, { labels: Array.from(new Set([...d.task.labels, ...task.labels])) });
                    archiveTasks([task.id]);
                    openDrawer(d.task.id);
                    toast(tt("drawer.merged"));
                  }}
                >
                  {tt("drawer.mergeInto")}
                </button>
              </div>
            ))
          ) : (
            <p className="mute">{tt("drawer.noSimilar")}</p>
          )}
        </div>
      )}

      {open === "split" && (
        <div className="ai-out">
          {splitTask(task.title).map((s) => (
            <div key={s} className="sugg">
              <span>{s}</span>
              <button className="ghost sm" onClick={() => addSubtask(task.id, s)}>
                ＋ {tt("common.add")}
              </button>
            </div>
          ))}
        </div>
      )}

      {pred && (
        <div className="ai-out">
          <p>
            {rich("drawer.likelyDone", { date: dateForOffset(pred.predictedOffset), pct: Math.round(pred.confidence * 100) })}{" "}
            <b style={{ color: pred.late ? "var(--bad)" : "var(--acc)" }}>{pred.late ? tt("drawer.lateVs", { date: dateForOffset(task.dueOffset) }) : tt("drawer.onTime")}</b>
          </p>
          {pred.risks.length > 0 && <p className="mute" style={{ fontSize: 12 }}>{tt("drawer.risks", { risks: pred.risks.join("; ") })}</p>}
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
              updateTask(task.id, { checklist: [...(task.checklist ?? []), ...testCases(task.title).map((c) => [c, 0] as [string, 0 | 1])] }, tt("drawer.testsActivity", { name: me }));
              toast(tt("drawer.addedChecklist"));
            }}
          >
            {tt("drawer.addToChecklist")}
          </button>
        </div>
      )}

      {open === "doc" && (
        <div className="ai-out">
          <pre className="doc-pre">{autoDoc(task, projects[task.projectId].name, moduleName(taskModule(task)))}</pre>
          <button
            className="ghost sm"
            onClick={() => {
              navigator.clipboard?.writeText(autoDoc(task, projects[task.projectId].name, moduleName(taskModule(task))));
              toast(tt("drawer.copiedMd"));
            }}
          >
            {tt("drawer.copyMd")}
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
  const { t: tt, rich } = useT();
  const me = members.me?.name.split(" ")[0] ?? tt("common.you");
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
      toast(tt("board.blockedBy", { title: blocker!.title }));
      return;
    }
    setTaskField(taskId, "status", v);
    toast(tt("board.movedTo", { column: columnLabel(task!.projectId, v) }));
  }

  function postComment() {
    const text = commentText.trim();
    if (!text) return toast(tt("drawer.writeComment"));
    addComment(taskId, text);
    setCommentText("");
    toast(tt("drawer.commentPosted"));
  }

  function submitSubtask() {
    const text = subtaskText.trim();
    if (!text) return toast(tt("drawer.enterSubtask"));
    addSubtask(taskId, text);
    setSubtaskText("");
  }

  function share() {
    const token = createShareLink("task", taskId);
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard?.writeText(url);
    toast(tt("drawer.linkCopied"));
  }

  const addLabel = (l: string) => {
    const v = l.trim();
    if (!v || task.labels.includes(v)) return;
    updateTask(taskId, { labels: [...task.labels, v] }, tt("drawer.actLabel", { name: me, label: v }));
  };

  return (
    <>
      <div className="meta" style={{ marginBottom: 10 }}>
        <span className="chip" style={{ color: projects[task.projectId]?.color }}>
          {projects[task.projectId]?.name}
        </span>
        <span style={{ display: "flex", gap: 6 }}>
          <button className="ic" aria-label={tt("drawer.focus")} title={tt("drawer.focusMode")} onClick={() => setFocusTaskId(taskId)}>
            <Crosshair size={16} />
          </button>
          {can("COL-04") && allowed("share.create") && (
            <button className="ic" aria-label={tt("drawer.copyShare")} title={tt("drawer.shareLink")} onClick={share}>
              <Link2 size={16} />
            </button>
          )}
          {allowed("task.create") && (
            <>
              <button
                className="ic"
                aria-label={tt("drawer.duplicateTask")}
                title={tt("drawer.duplicate")}
                onClick={() => {
                  const id = cloneTask(taskId);
                  if (id) {
                    openDrawer(id);
                    toast(tt("drawer.duplicated"));
                  }
                }}
              >
                <Copy size={16} />
              </button>
            </>
          )}
          {allowed("task.archive") && (
            <button className="ic" aria-label={tt("drawer.archiveTask")} title={tt("drawer.archive")} onClick={() => archiveTasks([taskId])}>
              <Archive size={16} />
            </button>
          )}
          {allowed("task.delete") && (
            <button className="ic" aria-label={tt("drawer.deleteTask")} title={tt("drawer.deleteUndo")} onClick={() => deleteTask(taskId)}>
              <Trash2 size={16} />
            </button>
          )}
          <button className="ic" aria-label={tt("common.close")} onClick={closeDrawer}>
            ✕
          </button>
        </span>
      </div>
      <input
        key={task.id + task.title}
        className="title-edit"
        defaultValue={task.title}
        disabled={locked}
        aria-label={tt("drawer.taskTitle")}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v && v !== task.title) updateTask(taskId, { title: v }, tt("drawer.actRenamed", { name: me, title: v }));
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />

      {task.id === "t1" && (
        <div className="pres">
          <Avatar id="ak" ring />
          {tt("drawer.isViewing")}{" "}
          <span className="ty">
            {tt("drawer.isTyping")}
            <i></i>
            <i></i>
            <i></i>
          </span>
        </div>
      )}

      {blockedActive && (
        <button className="warn" onClick={() => openDrawer(blocker!.id)}>
          {tt("drawer.blockedWarn", { title: blocker!.title })}
        </button>
      )}

      {task.status === "done" && (
        <p className="mute" style={{ marginBottom: 12 }}>
          {tt("drawer.doneLocked")}
        </p>
      )}
      {!canEdit && (
        <p className="mute" style={{ marginBottom: 12 }}>
          {tt("drawer.viewerRO")}
        </p>
      )}

      <div className="f2" style={{ marginBottom: 12 }}>
        <label>
          {tt("common.status")}
          <Dropdown value={task.status} onChange={onStatusChange} disabled={!canEdit} options={getColumns(task.projectId).map(([s]) => ({ value: s, label: columnLabel(task.projectId, s) }))} />
        </label>
        <label>
          {tt("common.priority")}
          <Dropdown
            value={task.priority}
            onChange={(v: Priority) => setTaskField(taskId, "priority", v)}
            options={(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => ({ value: k, label: PRIORITY_LABEL[k] }))}
            disabled={locked}
          />
        </label>
        <label>
          {tt("common.assignee")}
          <Dropdown
            value={task.assignee}
            onChange={(v: MemberId) => setTaskField(taskId, "assignee", v)}
            options={(Object.keys(members) as MemberId[]).map((k) => ({ value: k, label: members[k].name }))}
            disabled={locked || !allowed("task.assign")}
          />
        </label>
        <label>
          {tt("board.colDue")}
          <input
            type="date"
            value={dueIso}
            disabled={locked}
            onChange={(e) => e.target.value && updateTask(taskId, { dueOffset: offsetForDate(e.target.value) }, tt("drawer.actDue", { name: me, date: dateForOffset(offsetForDate(e.target.value)) }))}
          />
        </label>
      </div>

      <div className="f2 f3" style={{ marginBottom: 12 }}>
        <label>
          {tt("drawer.estimate")}
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
          {tt("drawer.energy")}
          <Dropdown<Energy | "">
            value={task.energy ?? ""}
            disabled={locked || !can("TIME-07")}
            onChange={(v) => updateTask(taskId, { energy: v || undefined })}
            options={[
              { value: "", label: can("TIME-07") ? tt("drawer.notSet") : `🔒 ${tt("plan.enterprise")}` },
              { value: "high", label: tt("drawer.energyHigh") },
              { value: "low", label: tt("drawer.energyLow") },
            ]}
          />
        </label>
        <label>
          {tt("drawer.repeats")}
          <Dropdown<Recurrence>
            value={task.recurrence ?? "none"}
            disabled={locked || !can("CORE-11")}
            onChange={(v) => updateTask(taskId, { recurrence: v }, v === "none" ? tt("drawer.actStopRepeat", { name: me }) : tt("drawer.actRepeat", { name: me, when: tt(`drawer.${v}`) }))}
            options={[
              { value: "none", label: can("CORE-11") ? tt("drawer.never") : `🔒 ${tt("plan.pro")}` },
              { value: "daily", label: tt("drawer.daily") },
              { value: "weekly", label: tt("drawer.weekly") },
              { value: "monthly", label: tt("drawer.monthly") },
            ]}
          />
        </label>
        <label>
          {tt("drawer.blockedByLabel")}
          <Dropdown<string>
            value={task.blockedBy ?? ""}
            disabled={locked || !can("CORE-12")}
            onChange={(v) => {
              if (v && tasks.find((t) => t.id === v)?.blockedBy === taskId) return toast(tt("drawer.loop"));
              updateTask(taskId, { blockedBy: v || undefined }, v ? tt("drawer.actBlocked", { name: me, title: tasks.find((t) => t.id === v)?.title ?? "" }) : tt("drawer.actUnblocked", { name: me }));
            }}
            options={[
              { value: "", label: can("CORE-12") ? tt("drawer.nothing") : `🔒 ${tt("plan.pro")}` },
              ...tasks.filter((t) => t.id !== taskId && t.projectId === task.projectId).map((t) => ({ value: t.id, label: t.title })),
            ]}
          />
        </label>
        <div className="field-switch">
          <span>
            {tt("drawer.billable")} {!can("CLI-04") && "🔒"}
          </span>
          <Switch label={tt("drawer.billable")} checked={!!task.billable} disabled={locked || !can("CLI-04")} onChange={(v) => updateTask(taskId, { billable: v })} />
        </div>
      </div>

      <label style={{ marginBottom: 12 }}>
        {tt("drawer.description")}
        <textarea
          key={task.id}
          rows={3}
          defaultValue={task.description}
          disabled={locked}
          onBlur={(e) => e.target.value !== task.description && updateTask(taskId, { description: e.target.value }, tt("drawer.actDesc", { name: me }))}
        />
      </label>

      <div className="meta" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>{tt("drawer.labels")}</h2>
      </div>
      <div className="lb" style={{ marginBottom: 6, flexWrap: "wrap" }}>
        {task.labels.map((l) => (
          <span key={l}>
            {l}
            {!locked && (
              <button className="lb-x" aria-label={tt("drawer.removeLabel", { label: l })} onClick={() => updateTask(taskId, { labels: task.labels.filter((x) => x !== l) })}>
                ×
              </button>
            )}
          </span>
        ))}
        {!locked && (
          <input
            className="lb-input"
            placeholder={tt("drawer.addLabel")}
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
          {tt("drawer.suggestedTags")}{" "}
          {suggestedTags.map((t) => (
            <button key={t} className="chip" style={{ marginInlineEnd: 4 }} onClick={() => addLabel(t[0].toUpperCase() + t.slice(1))}>
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
          {task.approval === "requested" && tt("drawer.approvalWaiting")}
          {task.approval === "approved" && tt("drawer.approvalApproved")}
          {task.approval === "rejected" && tt("drawer.approvalRejected")}
        </p>
      ) : (
        can("CLI-03") &&
        canEdit && (
          <button className="ghost sm" style={{ marginBottom: 12 }} onClick={() => updateTask(taskId, { approval: "requested" }, tt("drawer.actApproval", { name: me }))}>
            {tt("drawer.requestApproval")}
          </button>
        )
      )}

      <AiAssist task={task} locked={locked} />

      <div className="meta" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>{tt("drawer.attachments")}</h2>
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
              <button className="attach-remove" aria-label={tt("drawer.removeFile", { name: f.name })} onClick={() => removeAttachment(taskId, f.id)}>
                ✕
              </button>
            )}
          </div>
        ))}
        {!locked && (
          <>
            <label className="attach-add" title={tt("drawer.upload")}>
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
            <label className="attach-add" title={tt("drawer.photo")}>
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
        <h2 style={{ margin: 0 }}>{tt("drawer.subtasks")}</h2>
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
        <p className="mute">{tt("drawer.noSubtasks")}</p>
      )}
      {!locked && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 16 }}>
          <input placeholder={tt("drawer.addSubtask")} value={subtaskText} onChange={(e) => setSubtaskText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitSubtask()} />
          <button className="ghost" onClick={submitSubtask}>
            {tt("common.add")}
          </button>
        </div>
      )}

      <div className="meta" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>{tt("drawer.checklist")}</h2>
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
            placeholder={tt("drawer.addChecklist")}
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
            {tt("common.add")}
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
              {rich("drawer.tracked", { time: formatDuration(tracked) })}
              <br />
              <span className="mute" style={{ color: tracked / 3600 > estimate ? "var(--bad)" : undefined }}>
                {tt("drawer.ofEstimate", { h: estimate })}
                {tracked > 0 && ` · ${tt("drawer.used", { pct: Math.round((tracked / 3600 / Math.max(estimate, 0.1)) * 100) })}`}
              </span>
            </span>
            {task.status === "prog" && canEdit && (
              <div style={{ display: "flex", gap: 8 }}>
                {!isTracking && (
                  <button className="btn" onClick={() => startTracking(taskId)}>
                    {tt("drawer.start")}
                  </button>
                )}
                {isTracking && tracking!.status === "running" && (
                  <button className="ghost" onClick={pauseTracking}>
                    {tt("drawer.pause")}
                  </button>
                )}
                {isTracking && tracking!.status === "paused" && (
                  <button className="btn" onClick={() => startTracking(taskId)}>
                    {tt("drawer.resume")}
                  </button>
                )}
                {isTracking && (
                  <button className="ghost" onClick={endTracking}>
                    {tt("drawer.end")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Gate>

      <h2>{tt("drawer.comments")}</h2>
      {topLevelComments.length ? (
        topLevelComments.map((c) => <CommentThread key={c.id} root={c} allComments={taskComments} locked={locked} />)
      ) : (
        <p className="mute" style={{ marginBottom: 12 }}>
          {tt("drawer.noComments")}
        </p>
      )}
      {task.status !== "done" && allowed("comment.create") && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input placeholder={tt("drawer.commentPlaceholder")} value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && postComment()} />
          <button className="btn" onClick={postComment}>
            {tt("drawer.post")}
          </button>
        </div>
      )}

      <h2>{tt("drawer.activity")}</h2>
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
