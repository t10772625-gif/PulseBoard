"use client";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { TODAY } from "@/lib/mock-data";
import { download } from "@/lib/csv";
import { createFeed, feedUrl, listFeeds, revokeFeed, type Feed } from "@/lib/integrations";
import { taskKey } from "@/lib/task-keys";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useT } from "@/i18n/I18nProvider";

// Calendar: (1) a private subscription link so your tasks' due dates show up in
// Google Calendar / Outlook / Apple Calendar and stay updated; (2) a one-off .ics download.
export default function IntegrationCalendar() {
  const { tasks, projects, toast, realMode, workspaceId, taskPrefix } = useStore();
  const { t: tt } = useT();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const reload = useCallback(() => listFeeds(workspaceId).then(setFeeds), [workspaceId]);
  useEffect(() => {
    if (realMode && workspaceId) void reload();
  }, [realMode, workspaceId, reload]);

  function exportIcs() {
    const stamp = (off: number) => {
      const d = new Date(TODAY);
      d.setDate(d.getDate() + off);
      return d.toISOString().slice(0, 10).replace(/-/g, "");
    };
    const events = tasks
      .filter((t) => t.status !== "done")
      .map((t) => ["BEGIN:VEVENT", `UID:${t.id}@pulseboard`, `DTSTART;VALUE=DATE:${stamp(t.dueOffset)}`, `SUMMARY:${(taskKey(t, taskPrefix) + " " + t.title).trim().replace(/[,;]/g, " ")}`, `DESCRIPTION:${projects[t.projectId]?.name ?? ""}`, "END:VEVENT"].join("\r\n"));
    download("pulseboard-due-dates.ics", ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PulseBoard//EN", ...events, "END:VCALENDAR"].join("\r\n"), "text/calendar");
    toast(tt("int.exportedIcs", { n: events.length }));
  }

  return (
    <>
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[4]} hint={tt("int.hint")} />
      <div className="grid g2">
        {realMode && (
          <div className="card">
            <h2>{tt("int.feedTitle")}</h2>
            <Gate id="INT-02">
              <p className="mute" style={{ fontSize: 13, marginBottom: 8 }}>
                {tt("int.feedHint")}
              </p>
              {feeds.map((f) => (
                <div key={f.token} className="sugg">
                  <span className="code" dir="ltr" style={{ wordBreak: "break-all", fontSize: 12 }}>
                    {feedUrl(f.token)}
                  </span>
                  <span style={{ display: "flex", gap: 6 }}>
                    <button
                      className="ghost sm"
                      onClick={() => {
                        void navigator.clipboard?.writeText(feedUrl(f.token));
                        toast(tt("int.feedCopied"));
                      }}
                    >
                      {tt("common.copy")}
                    </button>
                    <button
                      className="ghost sm danger"
                      onClick={async () => {
                        if (!window.confirm(tt("int.feedRevokeConfirm"))) return;
                        if (await revokeFeed(f.token)) void reload();
                        else toast(tt("store.saveFailed"));
                      }}
                    >
                      {tt("int.feedRevoke")}
                    </button>
                  </span>
                </div>
              ))}
              {!feeds.length && (
                <button
                  className="btn sm"
                  onClick={async () => {
                    const f = await createFeed(workspaceId);
                    if (!f) return toast(tt("store.saveFailed"));
                    void reload();
                    toast(tt("int.feedCreated"));
                  }}
                >
                  {tt("int.feedCreate")}
                </button>
              )}
              <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>
                {tt("int.feedHow")}
              </p>
            </Gate>
          </div>
        )}
        <div className="card">
          <h2>{tt("int.calendarTitle")}</h2>
          <Gate id="INT-02">
            <p className="mute" style={{ fontSize: 13, marginBottom: 8 }}>
              {tt("int.calendarHint")}
            </p>
            <button className="ghost sm" onClick={exportIcs}>
              {tt("int.exportIcs")}
            </button>
          </Gate>
        </div>
      </div>
    </>
  );
}
