"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useStore, isBlocked, liveTrackedSeconds } from "@/lib/store";
import { useTick } from "@/lib/useTick";
import { PRIORITY_LABEL, dateForOffset, formatDuration } from "@/lib/mock-data";
import { Comment, MemberId, Priority, Status } from "@/types";
import { Avatar } from "./ui";
import Dropdown from "./Dropdown";

function activityIcon(message: string) {
  if (message.includes("commented") || message.includes("replied")) return "💬";
  if (message.includes("moved")) return "🔀";
  if (message.includes("priority")) return "⚑";
  if (message.includes("reassigned")) return "👤";
  if (message.includes("tracked")) return "⏱";
  if (message.includes("marked")) return "☑";
  if (message.includes("created")) return "✨";
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

function CommentRow({
  comment,
  locked,
  hintParentName,
}: {
  comment: Comment;
  locked: boolean;
  hintParentName?: string;
}) {
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
        <p dangerouslySetInnerHTML={{ __html: comment.text.replace(/@(\w+)/g, "<mark>@$1</mark>") }} />
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

export default function TaskDrawer({ taskId }: { taskId: string }) {
  const {
    tasks,
    projects,
    members,
    comments,
    activity,
    toggleSubtask,
    addSubtask,
    setTaskField,
    deleteTask,
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
  } = useStore();
  const [commentText, setCommentText] = useState("");
  const [subtaskText, setSubtaskText] = useState("");
  const task = tasks.find((t) => t.id === taskId);
  const isTracking = tracking?.taskId === taskId;
  useTick(isTracking && tracking?.status === "running");

  if (!task) return null;

  const locked = task.status === "done";
  const blocker = task.blockedBy ? tasks.find((t) => t.id === task.blockedBy) : undefined;
  const blockedActive = blocker && blocker.status !== "done";
  const taskComments = comments[taskId] || [];
  const topLevelComments = taskComments.filter((c) => c.parentId === null);
  const doneCount = task.subtasks.filter((s) => s[1]).length;
  const taskActivity = activity[taskId] || [];
  const taskFiles = attachments[taskId] || [];

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

  function onDelete() {
    if (!window.confirm(`Delete "${task!.title}"? This cannot be undone.`)) return;
    deleteTask(taskId);
    toast("Task deleted");
  }

  function submitSubtask() {
    const text = subtaskText.trim();
    if (!text) return toast("Enter a subtask title first");
    addSubtask(taskId, text);
    setSubtaskText("");
  }

  return (
    <>
      <div className="meta" style={{ marginBottom: 10 }}>
        <span className="chip" style={{ color: projects[task.projectId]?.color }}>
          {projects[task.projectId]?.name}
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          <button className="ic" aria-label="Delete task" title="Delete task" onClick={onDelete}>
            <Trash2 size={16} />
          </button>
          <button className="ic" aria-label="Close" onClick={closeDrawer}>
            ✕
          </button>
        </span>
      </div>
      <h1 style={{ fontSize: 23, marginBottom: 8 }}>{task.title}</h1>

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

      {locked && (
        <p className="mute" style={{ marginBottom: 12 }}>
          This task is done and locked. Only status can be changed — reopen it to edit anything else.
        </p>
      )}

      <div className="f2" style={{ marginBottom: 16 }}>
        <label>
          Status
          <Dropdown value={task.status} onChange={onStatusChange} options={getColumns(task.projectId).map(([s, label]) => ({ value: s, label }))} />
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
            disabled={locked}
          />
        </label>
        <label>
          Due
          <input value={dateForOffset(task.dueOffset)} readOnly />
        </label>
      </div>

      <label style={{ marginBottom: 16 }}>
        Description
        <textarea rows={3} defaultValue={task.description} disabled={locked} />
      </label>

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
          <label className="attach-add">
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
          <input
            placeholder="Add a subtask"
            value={subtaskText}
            onChange={(e) => setSubtaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSubtask()}
          />
          <button className="ghost" onClick={submitSubtask}>
            Add
          </button>
        </div>
      )}

      {task.status === "prog" && (
        <div
          className="card"
          style={{ margin: "16px 0", padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}
        >
          <span>
            <b>{formatDuration(liveTrackedSeconds(task, tracking))}</b> tracked
            <br />
            <span className="mute">of {task.lengthDays}h estimated</span>
          </span>
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
        </div>
      )}

      <h2>Comments</h2>
      {topLevelComments.length ? (
        topLevelComments.map((c) => <CommentThread key={c.id} root={c} allComments={taskComments} locked={locked} />)
      ) : (
        <p className="mute" style={{ marginBottom: 12 }}>
          No comments yet. Start the conversation.
        </p>
      )}
      {!locked && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            placeholder="Write a comment, use @ to mention"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && postComment()}
          />
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
