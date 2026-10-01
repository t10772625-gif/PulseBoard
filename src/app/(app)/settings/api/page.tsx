"use client";
import Gate from "@/components/Gate";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

const API: [string, string, MessageKey][] = [
  ["GET", "/api/boards", "api.listBoards"],
  ["POST", "/api/boards", "api.createBoard"],
  ["GET", "/api/boards/:id/tasks", "api.listTasks"],
  ["POST", "/api/tasks", "api.createTask"],
  ["PATCH", "/api/tasks/:id", "api.updateTask"],
  ["POST", "/api/tasks/:id/assign/smart", "api.smartAssign"],
  ["POST", "/api/webhooks", "api.webhook"],
];

export default function ApiSettings() {
  const { t } = useT();
  return (
    <>
      <SettingsHeader title={t("api.title")} hint={t("api.hint")} />
      <div className="card">
        <h2>{t("api.title")}</h2>
        <Gate id="ADV-03">
          <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>{t("api.planned")}</p>
          <table className="tbl">
            <tbody>
              {API.map(([m, p, d]) => (
                <tr key={m + p}>
                  <td dir="ltr">
                    <b>{m}</b>
                  </td>
                  <td className="code" dir="ltr">
                    {p}
                  </td>
                  <td>{t(d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Gate>
      </div>
    </>
  );
}
