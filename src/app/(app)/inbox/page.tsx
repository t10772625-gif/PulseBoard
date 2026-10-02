"use client";
import { useState } from "react";
import { EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";

export default function Inbox() {
  const { notifications, markAllRead, markRead, openDrawer, activity, audit, tasks, members, digestMode } = useStore();
  const { t: tt, fmt } = useT();
  const [tab, setTab] = useState<"notifications" | "activity">("notifications");
  const unread = notifications.filter((n) => n.unread).length;

  // Activity feed (COL-07): this session's changes first, then each task's history
  const feed = [
    ...audit.map((a) => ({ id: a.id, taskId: a.taskId, text: `${members[a.actor]?.name ?? tt("ui.formerMember")}: ${a.message}`, when: fmt.time(a.at) })),
    ...Object.values(activity)
      .flat()
      .filter((e) => e.at && e.at !== "Just now" && e.at !== tt("time.justNow"))
      .map((e) => ({ id: e.id, taskId: e.taskId, text: `${e.message} — ${tasks.find((t) => t.id === e.taskId)?.title ?? ""}`, when: e.at })),
  ];

  return (
    <>
      <div className="top">
        <div>
          <h1>{tt("inbox.title")}</h1>
          <p className="mute">
            {tt("inbox.unread", { n: unread })}
            {digestMode ? ` · ${tt("inbox.digestOn")}` : ""}
          </p>
        </div>
        <div className="pill-row">
          <div className="tabs">
            <button className={tab === "notifications" ? "on" : ""} onClick={() => setTab("notifications")}>
              {tt("inbox.tabNotifications")}
            </button>
            <button className={tab === "activity" ? "on" : ""} onClick={() => setTab("activity")}>
              {tt("inbox.tabActivity")}
            </button>
          </div>
          {tab === "notifications" && unread > 0 && (
            <button className="ghost" onClick={markAllRead}>
              {tt("inbox.markAll")}
            </button>
          )}
        </div>
      </div>
      <div className="card" style={{ padding: "8px 20px" }}>
        {tab === "notifications" && notifications.length === 0 && <EmptyState title={tt("inbox.empty")} message={tt("inbox.emptyMsg")} />}
        {tab === "notifications" &&
          notifications.map((n, i) => (
            <button
              key={i}
              className="row"
              onClick={() => {
                markRead(i);
                openDrawer(n.taskId);
              }}
            >
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: n.unread ? "#FF6B57" : "transparent" }}></span>
                <span style={{ fontWeight: n.unread ? 800 : 400 }}>{n.message}</span>
              </span>
              <span className="mute">{n.when}</span>
            </button>
          ))}
        {tab === "activity" &&
          (feed.length ? (
            feed.map((f) => (
              <button key={f.id} className="row" onClick={() => f.taskId && tasks.some((t) => t.id === f.taskId) && openDrawer(f.taskId)}>
                <span>{f.text}</span>
                <span className="mute">{f.when}</span>
              </button>
            ))
          ) : (
            <p className="mute" style={{ padding: "12px 0" }}>
              {tt("inbox.noActivity")}
            </p>
          ))}
      </div>
    </>
  );
}
