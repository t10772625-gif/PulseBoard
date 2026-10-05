"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Database, Download, Info, PauseCircle, Trash2, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { download } from "@/lib/csv";
import Gate from "@/components/Gate";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";

// The confirmation word stays "DELETE" in every language so it is easy to type
const CONFIRM_WORD = "DELETE";

export default function DataSettings() {
  const s = useStore();
  const { t } = useT();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const canExport = s.allowed("data.export");

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
    if (confirmText !== CONFIRM_WORD) return;
    setBusy(true);
    const { error } = await sb.rpc("delete_my_account");
    setBusy(false);
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
      <div className="ux-page">
        <section className="card ux-hero" aria-labelledby="dt-hero">
          <span className="ux-icon" aria-hidden>
            <Database size={22} />
          </span>
          <div className="ux-hero-main">
            <h2 id="dt-hero">{t("data.heroTitle")}</h2>
            <p className="mute">{t("data.heroText")}</p>
          </div>
        </section>

        <div className="grid g2">
          <section className="card ux-sec" aria-labelledby="dt-export">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <Download size={18} />
              </span>
              <h2 id="dt-export">{t("data.exportTitle")}</h2>
            </div>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>
              {t("data.exportText")}
            </p>
            {!canExport && (
              <p className="st-demo-warn" style={{ margin: 0 }}>
                <Info size={14} aria-hidden /> {t("data.cantExport")}
              </p>
            )}
            <div className="ux-actions">
              <button
                className="btn"
                disabled={!canExport}
                onClick={() => {
                  download("pulseboard-export.json", s.exportData(), "application/json");
                  s.toast(t("data.exported"));
                }}
              >
                <Download size={16} aria-hidden /> {t("data.exportBtn")}
              </button>
            </div>
          </section>

          <section className="card ux-sec" aria-labelledby="dt-backup">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <Archive size={18} />
              </span>
              <h2 id="dt-backup">{t("data.backupTitle")}</h2>
            </div>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>
              {t("data.backupText")}
            </p>
            <Gate id="ADV-05">
              {/* Restoring a file over a live, shared workspace would overwrite teammates' work, so it's demo-only */}
              {s.realMode && (
                <p className="st-demo-warn" style={{ margin: "0 0 12px" }}>
                  <Info size={14} aria-hidden /> {t("data.restoreLive")}
                </p>
              )}
              <div className="ux-actions">
                {!s.realMode && (
                  <label className="ghost" style={{ cursor: "pointer" }}>
                    <Upload size={16} aria-hidden /> {t("data.restore")}
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
                <button className="btn" disabled={!canExport} onClick={() => download(`backup-${new Date().toISOString().slice(0, 10)}.json`, s.exportData(), "application/json")}>
                  <Archive size={16} aria-hidden /> {t("data.createBackup")}
                </button>
              </div>
            </Gate>
          </section>
        </div>

        <section className="card ux-sec" aria-labelledby="dt-pause">
          <div className="ux-sec-head">
            <span className="ux-icon sm warn" aria-hidden>
              <PauseCircle size={18} />
            </span>
            <h2 id="dt-pause">{t("data.deactivateTitle")}</h2>
          </div>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {t("data.deactivateText")}
          </p>
          {s.realMode && (
            <p className="st-demo-warn" style={{ margin: 0 }}>
              <Info size={14} aria-hidden /> {t("data.needsUpdate")}
            </p>
          )}
          <div className="ux-actions">
            <button className="ghost" onClick={deactivate}>
              <PauseCircle size={16} aria-hidden /> {t("data.deactivate")}
            </button>
          </div>
        </section>

        <section className="card ux-sec ux-danger" aria-labelledby="dt-delete">
          <div className="ux-sec-head">
            <span className="ux-icon sm bad" aria-hidden>
              <Trash2 size={18} />
            </span>
            <h2 id="dt-delete">{t("data.dangerTitle")}</h2>
          </div>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {t("data.deleteText")}
          </p>
          <ul className="nb-list" style={{ margin: 0 }}>
            <li>{t("data.deletePoint1")}</li>
            <li>{t("data.deletePoint2")}</li>
            <li>{t("data.deletePoint3")}</li>
          </ul>
          <div className="ux-inline">
            <label>
              {t("data.typeToConfirm", { word: CONFIRM_WORD })}
              <input dir="ltr" value={confirmText} autoComplete="off" placeholder={CONFIRM_WORD} disabled={!s.realMode} onChange={(e) => setConfirmText(e.target.value.trim())} />
            </label>
            <button className="btn ux-btn-bad" disabled={!s.realMode || busy || confirmText !== CONFIRM_WORD} onClick={deleteAccount}>
              <Trash2 size={16} aria-hidden /> {busy ? t("auth.wait") : t("data.deleteAccount")}
            </button>
          </div>
          {!s.realMode && (
            <p className="st-demo-warn" style={{ margin: 0 }}>
              <Info size={14} aria-hidden /> {t("data.demoAccount")}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
