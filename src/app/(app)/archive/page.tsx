"use client";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";

// Archived tasks (CORE-21) and recently deleted tasks (CORE-22)
export default function ArchivePage() {
  const { archived, unarchiveTasks, trash, restoreTasks, purgeTrash, projects, toast, allowed } = useStore();
  const { t: tt, fmt } = useT();
  const canArchive = allowed("task.archive");
  const canDelete = allowed("task.delete");
  return (
    <>
      <div className="top">
        <div>
          <h1>{tt("archive.title")}</h1>
          <p className="mute">{tt("archive.hint")}</p>
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h2>{tt("archive.archived", { n: archived.length })}</h2>
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
                    toast(tt("archive.restoredBoard"));
                  }}
                >
                  {tt("archive.restore")}
                </button>
              </div>
            ))
          ) : (
            <p className="mute">{tt("archive.nothing")}</p>
          )}
        </div>
        <div className="card">
          <div className="meta">
            <h2 style={{ margin: 0 }}>{tt("archive.trash", { n: trash.length })}</h2>
            {trash.length > 0 && canDelete && (
              <button
                className="ghost sm danger"
                onClick={() => {
                  if (!window.confirm(tt("archive.emptyConfirm"))) return;
                  purgeTrash();
                  toast(tt("archive.emptied"));
                }}
              >
                {tt("archive.emptyTrash")}
              </button>
            )}
          </div>
          {trash.length ? (
            trash.map((x) => (
              <div key={x.task.id} className="sugg">
                <span>
                  <b>{x.task.title}</b>{" "}
                  <span className="mute">
                    {projects[x.task.projectId]?.name} · {tt("archive.deletedAt", { time: fmt.time(x.deletedAt) })}
                  </span>
                </span>
                <button
                  className="ghost sm"
                  disabled={!canDelete}
                  onClick={() => {
                    restoreTasks([x.task.id]);
                    toast(tt("archive.restoredAll"));
                  }}
                >
                  {tt("archive.restore")}
                </button>
              </div>
            ))
          ) : (
            <p className="mute">{tt("archive.trashEmpty")}</p>
          )}
        </div>
      </div>
    </>
  );
}
