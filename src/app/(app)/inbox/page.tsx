"use client";
import { useStore } from "@/lib/store";

export default function Inbox() {
  const { notifications, markAllRead, markRead, openDrawer } = useStore();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <>
      <div className="top">
        <div>
          <h1>Inbox</h1>
          <p className="mute">{unread} unread</p>
        </div>
        <button className="ghost" onClick={markAllRead}>
          Mark all as read
        </button>
      </div>
      <div className="card" style={{ padding: "8px 20px" }}>
        {notifications.map((n, i) => (
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
      </div>
    </>
  );
}
