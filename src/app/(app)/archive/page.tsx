"use client";
import { useStore } from "@/lib/store";

// Archived tasks (CORE-21) and recently deleted tasks (CORE-22)
export default function ArchivePage() {
  const { archived, unarchiveTasks, trash, restoreTasks, purgeTrash, projects, toast, allowed } = useStore();
  const canArchive = allowed("task.archive");
  const canDelete = allowed("task.delete");
  return (
    <>
      <div className="top">
        <div>
          <h1>Archive &amp; trash</h1>
          <p className="mute">Archived tasks are hidden from boards but kept. Deleted tasks can be restored until you empty the trash.</p>
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h2>Archived ({archived.length})</h2>
          {archived.length ? (
            archived.map((t) => (
              <div key={t.id} className="sugg">
                <span>
                  <b>{t.title}</b> <span className="mute">{projects[t.projectId]?.name}</span>
                </span>
                <button
                  className="ghost sm"
                  disabled={!canArchive}
                  onClick={() => {
                    unarchiveTasks([t.id]);
                    toast("Restored to the board");
                  }}
                >
                  Restore
                </button>
              </div>
            ))
          ) : (
            <p className="mute">Nothing archived.</p>
          )}
        </div>
        <div className="card">
          <div className="meta">
            <h2 style={{ margin: 0 }}>Trash ({trash.length})</h2>
            {trash.length > 0 && canDelete && (
              <button
                className="ghost sm danger"
                onClick={() => {
                  if (!window.confirm("Permanently delete everything in the trash?")) return;
                  purgeTrash();
                  toast("Trash emptied");
                }}
              >
                Empty trash
              </button>
            )}
          </div>
          {trash.length ? (
            trash.map((x) => (
              <div key={x.task.id} className="sugg">
                <span>
                  <b>{x.task.title}</b>{" "}
                  <span className="mute">
                    {projects[x.task.projectId]?.name} · deleted {new Date(x.deletedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
                <button
                  className="ghost sm"
                  disabled={!canDelete}
                  onClick={() => {
                    restoreTasks([x.task.id]);
                    toast("Task restored with its comments and files");
                  }}
                >
                  Restore
                </button>
              </div>
            ))
          ) : (
            <p className="mute">Trash is empty.</p>
          )}
        </div>
      </div>
    </>
  );
}
