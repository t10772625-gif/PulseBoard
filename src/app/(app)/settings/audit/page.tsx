"use client";
import { useMemo, useState } from "react";
import { Download, History, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { download, toCsv } from "@/lib/csv";
import { taskKey } from "@/lib/task-keys";
import Gate from "@/components/Gate";
import SettingsHeader from "@/components/SettingsHeader";
import { Avatar, EmptyState } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

const PAGE = 50;

export default function AuditSettings() {
  const s = useStore();
  const { t, fmt } = useT();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const name = (actor: string) => s.members[actor]?.name ?? t("ui.formerMember");
  const taskOf = (id?: string) => (id ? s.tasks.find((x) => x.id === id) : undefined);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return s.audit;
    return s.audit.filter((a) => {
      const task = a.taskId ? s.tasks.find((x) => x.id === a.taskId) : undefined;
      return [a.message, s.members[a.actor]?.name ?? "", task ? taskKey(task, s.taskPrefix) : ""].some((v) => v.toLowerCase().includes(q));
    });
  }, [query, s.audit, s.tasks, s.members, s.taskPrefix]);

  const when = (at: number) => fmt.date(new Date(at), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <SettingsHeader title={t("audit.title")} hint={t("audit.hint")} />
      <div className="ux-page">
        <section className="card ux-sec" aria-labelledby="au-h">
          <div className="ux-sec-head">
            <span className="ux-icon sm" aria-hidden>
              <History size={18} />
            </span>
            <h2 id="au-h">{t("audit.title")}</h2>
            <div className="ux-pills">
              <span className="ux-conf">{t("audit.count", { shown: fmt.number(Math.min(limit, rows.length)), total: fmt.number(rows.length) })}</span>
            </div>
          </div>
          <div className="ux-inline">
            <label>
              <span className="ux-search">
                <Search size={16} aria-hidden />
                <input
                  type="search"
                  aria-label={t("audit.search")}
                  value={query}
                  placeholder={t("audit.search")}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setLimit(PAGE);
                  }}
                />
              </span>
            </label>
            <Gate id="CORE-17-EXPORT" compact>
              <button
                className="ghost"
                disabled={!s.audit.length}
                onClick={() =>
                  download(
                    "audit-log.csv",
                    toCsv([[t("audit.colTime"), t("audit.colActor"), t("audit.colEvent"), t("audit.colTask")], ...s.audit.map((a) => [new Date(a.at).toISOString(), name(a.actor), a.message, a.taskId ?? ""])])
                  )
                }
              >
                <Download size={16} aria-hidden /> {t("audit.exportCsv")}
              </button>
            </Gate>
          </div>

          {!s.audit.length ? (
            <EmptyState compact icon={<History size={26} />} title={t("audit.emptyTitle")} message={t("audit.empty")} />
          ) : !rows.length ? (
            <EmptyState compact icon={<Search size={26} />} title={t("ux.noMatches")} message={t("audit.noMatchHint")} />
          ) : (
            <>
              <div className="ux-table-wrap">
                <table className="ux-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("audit.colTime")}</th>
                      <th scope="col">{t("audit.colActor")}</th>
                      <th scope="col">{t("audit.colEvent")}</th>
                      <th scope="col">{t("audit.colTask")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, limit).map((a) => {
                      const task = taskOf(a.taskId);
                      return (
                        <tr key={a.id}>
                          <td className="mute" style={{ whiteSpace: "nowrap" }}>
                            {when(a.at)}
                          </td>
                          <td>
                            <span className="ux-actor">
                              <Avatar id={a.actor} /> {name(a.actor)}
                            </span>
                          </td>
                          <td>{a.message}</td>
                          <td>
                            {task ? (
                              <button className="task-key" dir="ltr" onClick={() => s.openDrawer(task.id)}>
                                {taskKey(task, s.taskPrefix)}
                              </button>
                            ) : a.taskId ? (
                              <span className="mute" style={{ fontSize: 12 }}>
                                {t("audit.taskGone")}
                              </span>
                            ) : (
                              <span className="mute">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length > limit && (
                <div className="ux-actions" style={{ justifyContent: "center" }}>
                  <button className="ghost" onClick={() => setLimit((n) => n + PAGE)}>
                    {t("ux.showMore")}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
