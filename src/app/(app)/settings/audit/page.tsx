"use client";
import { useStore } from "@/lib/store";
import { download, toCsv } from "@/lib/csv";
import Gate from "@/components/Gate";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";

export default function AuditSettings() {
  const s = useStore();
  const { t, fmt } = useT();

  return (
    <>
      <SettingsHeader title={t("audit.title")} hint={t("audit.hint")} />
      <div className="card">
        <div className="meta">
          <h2 style={{ margin: 0 }}>{t("audit.title")}</h2>
          <Gate id="CORE-17-EXPORT" compact>
            <button
              className="ghost sm"
              onClick={() =>
                download(
                  "audit-log.csv",
                  toCsv([[t("audit.colTime"), t("audit.colActor"), t("audit.colEvent"), t("audit.colTask")], ...s.audit.map((a) => [new Date(a.at).toISOString(), s.members[a.actor].name, a.message, a.taskId ?? ""])])
                )
              }
            >
              {t("audit.exportCsv")}
            </button>
          </Gate>
        </div>
        {s.audit.length ? (
          s.audit.slice(0, 12).map((a) => (
            <p key={a.id} className="act-item" style={{ fontSize: 13 }}>
              <span className="mute">{fmt.time(a.at)}</span> {s.members[a.actor].name}: {a.message}
            </p>
          ))
        ) : (
          <p className="mute">{t("audit.empty")}</p>
        )}
      </div>
    </>
  );
}
