"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { listDeliveries, serverSetup, type Delivery } from "@/lib/integrations";
import { AUTOMATION_GROUP, AUTOMATION_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useT } from "@/i18n/I18nProvider";

// ADV-04 webhook delivery log. Real mode: what the server actually sent (rule
// webhooks signed with HMAC, Slack / Discord posts) and the HTTP status it got
// back; demo mode: the local log of rules that would have fired.
export default function AutomationWebhooks() {
  const { webhookLog, realMode, workspaceId } = useStore();
  const { t: tt, fmt } = useT();
  const [rows, setRows] = useState<Delivery[] | null>(null);
  const [signing, setSigning] = useState<boolean | null>(null);
  useEffect(() => {
    if (!realMode || !workspaceId) return;
    void listDeliveries(workspaceId).then(setRows);
    void serverSetup().then((s) => setSigning(!!s?.ruleWebhooks));
  }, [realMode, workspaceId]);

  const statusText = (c: number | null) => (c === -1 ? tt("auto.whSkipped") : !c ? tt("auto.whNoAnswer") : c >= 200 && c < 300 ? tt("auto.whOk", { code: c }) : tt("auto.whFailed", { code: c }));

  return (
    <>
      <SubPageHeader group={AUTOMATION_GROUP} page={AUTOMATION_PAGES[1]} hint={tt("auto.hint")} />
      <div className="grid g2">
        <div className="card">
          <h2>{tt("auto.webhooks")}</h2>
          <Gate id="ADV-04">
            <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
              {realMode ? tt("auto.webhooksHintReal") : tt("auto.webhooksHint")}
            </p>
            {realMode && signing === false && <p className="warn" style={{ marginBottom: 8 }}>{tt("auto.whNoSecret")}</p>}
            {realMode ? (
              rows === null ? (
                <p className="mute">{tt("security.loadingSessions")}</p>
              ) : rows.length ? (
                rows.map((w) => (
                  <div key={w.id} className="sugg">
                    <span className="code" dir="ltr" style={{ wordBreak: "break-all" }}>
                      {w.target === "rule" ? w.url : `${w.target}: ${w.url.replace(/^https:\/\//, "")}`}
                    </span>
                    <span className="mute" style={{ fontSize: 12 }}>
                      {w.event} · {fmt.time(new Date(w.created_at).getTime(), { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · {statusText(w.status_code)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="mute">{tt("auto.noDeliveries")}</p>
              )
            ) : webhookLog.length ? (
              webhookLog.map((w) => (
                <div key={w.id} className="sugg">
                  <span className="code" dir="ltr">{w.url}</span>
                  <span className="mute" style={{ fontSize: 12 }}>
                    {w.event} · {fmt.time(w.at, { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · {w.ok ? tt("auto.queued") : tt("auto.noUrl")}
                  </span>
                </div>
              ))
            ) : (
              <p className="mute">{tt("auto.noDeliveries")}</p>
            )}
          </Gate>
        </div>
      </div>
    </>
  );
}
