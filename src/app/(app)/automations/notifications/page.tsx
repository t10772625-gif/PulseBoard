"use client";
import { useStore } from "@/lib/store";
import { enablePush, testPush } from "@/lib/integrations";
import { AUTOMATION_GROUP, AUTOMATION_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { SettingRow, Switch } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

const PUSH_RESULT: Record<string, MessageKey> = {
  ok: "auto.pushOn",
  denied: "auto.notGranted",
  unsupported: "auto.noBrowserNotif",
  setup: "auto.pushSetup",
  failed: "auto.pushFailed",
};

// NOTIF-03 daily digest + push notifications. Real mode: Web Push through the
// service worker, so a notification arrives even when PulseBoard isn't open
// (e.g. "you were assigned"). Demo mode: the browser's own notification popup only.
export default function AutomationNotifications() {
  const { digestMode, setDigestMode, toast, realMode, workspaceId } = useStore();
  const { t: tt } = useT();
  return (
    <>
      <SubPageHeader group={AUTOMATION_GROUP} page={AUTOMATION_PAGES[2]} hint={tt("auto.hint")} />
      <div className="grid g2">
        <div className="card">
          <h2>{tt("auto.notifications")}</h2>
          <Gate id="NOTIF-03">
            <SettingRow title={tt("auto.digest")} hint={tt("auto.digestHint")}>
              <Switch label={tt("auto.digest")} checked={digestMode} onChange={setDigestMode} />
            </SettingRow>
          </Gate>
          <div className="pill-row" style={{ marginTop: 12 }}>
            <button
              className="ghost sm"
              onClick={async () => {
                if (!realMode) {
                  if (!("Notification" in window)) return toast(tt("auto.noBrowserNotif"));
                  const p = await window.Notification.requestPermission();
                  return toast(p === "granted" ? tt("auto.browserOn") : tt("auto.notGranted"));
                }
                toast(tt(PUSH_RESULT[await enablePush()]));
              }}
            >
              {tt("auto.enableBrowser")}
            </button>
            {realMode && (
              <button
                className="ghost sm"
                onClick={async () => {
                  const res = await testPush(workspaceId);
                  toast(res.ok && (res.data?.sent ?? 0) > 0 ? tt("auto.pushTestSent") : res.status === 503 ? tt("auto.pushSetup") : tt("auto.pushTestNone"));
                }}
              >
                {tt("auto.pushTest")}
              </button>
            )}
          </div>
          <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>
            {realMode ? tt("auto.pushHint") : tt("auto.pushDemoHint")}
          </p>
        </div>
      </div>
    </>
  );
}
