"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { download } from "@/lib/csv";
import Gate from "@/components/Gate";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";

export default function DataSettings() {
  const s = useStore();
  const { t } = useT();
  const router = useRouter();

  // Deactivate (reversible) and delete (irreversible) run as database functions on
  // your own account only (23_account-security …2320). Demo mode has no account.
  async function deactivate() {
    if (!s.realMode) return s.toast(t("data.demoAccount"));
    if (!window.confirm(t("data.deactivateConfirm"))) return;
    if (!(await s.setAccountActive(false))) return s.toast(t("store.saveFailed"));
    await s.logout();
    router.push("/login");
  }

  async function deleteAccount() {
    const sb = getSupabase();
    if (!s.realMode || !sb) return s.toast(t("data.demoAccount"));
    // The confirmation word stays "DELETE" in every language so it is easy to type
    if (window.prompt(t("data.deletePrompt")) !== "DELETE") return;
    const { error } = await sb.rpc("delete_my_account");
    if (error) {
      console.error("[delete account]", error);
      return s.toast(/other members/i.test(error.message) ? t("data.deleteHasMembers") : t("store.saveFailed"));
    }
    await s.logout();
    router.push("/login");
  }

  return (
    <>
      <SettingsHeader title={t("data.title")} hint={t("data.hint")} />
      <div className="card">
        <h2>{t("data.title")}</h2>
        <div className="pill-row">
          <button
            className="ghost sm"
            disabled={!s.allowed("data.export")}
            title={s.allowed("data.export") ? undefined : t("data.cantExport")}
            onClick={() => {
              download("pulseboard-export.json", s.exportData(), "application/json");
              s.toast(t("data.exported"));
            }}
          >
            {t("data.exportAll")}
          </button>
        </div>
        <h3 style={{ marginTop: 14 }}>{t("data.backupTitle")}</h3>
        <Gate id="ADV-05">
          <div className="pill-row">
            <button className="ghost sm" onClick={() => download(`backup-${new Date().toISOString().slice(0, 10)}.json`, s.exportData(), "application/json")}>
              {t("data.createBackup")}
            </button>
            {/* Restoring a file over a live, shared workspace would overwrite teammates' work, so it's demo-only */}
            {s.realMode ? (
              <span className="mute" style={{ fontSize: 12 }}>
                {t("data.restoreLive")}
              </span>
            ) : (
              <label className="ghost sm" style={{ cursor: "pointer" }}>
                {t("data.restore")}
                <input
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (!window.confirm(t("data.restoreConfirm"))) return;
                    f.text().then((text) => s.toast(s.importData(text) ? t("data.restored") : t("data.notBackup")));
                  }}
                />
              </label>
            )}
          </div>
        </Gate>
        <h3 style={{ marginTop: 14 }}>{t("data.account")}</h3>
        <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
          {t("data.accountHint")}
        </p>
        <div className="pill-row">
          <button className="ghost sm" onClick={deactivate}>
            {t("data.deactivate")}
          </button>
          <button className="ghost sm danger" onClick={deleteAccount}>
            {t("data.deleteAccount")}
          </button>
        </div>
      </div>
    </>
  );
}
