"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CalendarPlus, ChevronRight, Copy, Download, Info, Link2, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { TODAY } from "@/lib/mock-data";
import { download } from "@/lib/csv";
import { createFeed, feedUrl, listFeeds, revokeFeed, type Feed } from "@/lib/integrations";
import { taskKey } from "@/lib/task-keys";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { EmptyState } from "@/components/ui";
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
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[4]} hint={tt("cal.hint")} />
      <div className="ux-page">
        <FeatureHero id="cal-hero" icon={CalendarDays} title={tt("cal.heroTitle")} text={tt("cal.heroText")} status="available" statusText={tt("ux.st.available")} planId="INT-02" />
        <HowItWorks
          id="cal-how"
          steps={[
            { title: tt("cal.s1"), text: tt("cal.s1t") },
            { title: tt("cal.s2"), text: tt("cal.s2t") },
            { title: tt("cal.s3"), text: tt("cal.s3t") },
          ]}
        />

        <div className="grid g2">
          <section className="card ux-sec" aria-labelledby="cal-feed">
            <SecHead id="cal-feed" icon={Link2} title={tt("int.feedTitle")}>
              {realMode ? <span className="int-st available">{tt("ux.st.available")}</span> : <span className="int-st setup">{tt("ux.st.realOnly")}</span>}
            </SecHead>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>
              {tt("int.feedHint")}
            </p>
            <Gate id="INT-02">
              {!realMode ? (
                <p className="st-demo-warn" style={{ margin: 0 }}>
                  <Info size={14} aria-hidden /> {tt("cal.feedDemo")}
                </p>
              ) : feeds.length ? (
                feeds.map((f) => (
                  <div key={f.token} className="ux-result">
                    <span className="code" dir="ltr" style={{ wordBreak: "break-all", fontSize: 12 }}>
                      {feedUrl(f.token)}
                    </span>
                    <div className="ux-actions">
                      <button
                        className="ghost sm danger"
                        onClick={async () => {
                          if (!window.confirm(tt("int.feedRevokeConfirm"))) return;
                          if (await revokeFeed(f.token)) void reload();
                          else toast(tt("store.saveFailed"));
                        }}
                      >
                        <Trash2 size={14} aria-hidden /> {tt("int.feedRevoke")}
                      </button>
                      <button
                        className="btn sm"
                        onClick={() => {
                          void navigator.clipboard?.writeText(feedUrl(f.token));
                          toast(tt("int.feedCopied"));
                        }}
                      >
                        <Copy size={14} aria-hidden /> {tt("common.copy")}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  compact
                  icon={<Link2 size={26} />}
                  title={tt("cal.noFeed")}
                  message={tt("cal.noFeedText")}
                  action={
                    <button
                      className="btn"
                      onClick={async () => {
                        const f = await createFeed(workspaceId);
                        if (!f) return toast(tt("store.saveFailed"));
                        void reload();
                        toast(tt("int.feedCreated"));
                      }}
                    >
                      <CalendarPlus size={16} aria-hidden /> {tt("int.feedCreate")}
                    </button>
                  }
                />
              )}
              <p className="mute st-foot">
                <Info size={14} aria-hidden /> {tt("int.feedHow")}
              </p>
            </Gate>
          </section>

          <section className="card ux-sec" aria-labelledby="cal-ics">
            <SecHead id="cal-ics" icon={Download} title={tt("int.calendarTitle")}>
              <span className="int-st available">{tt("ux.st.available")}</span>
            </SecHead>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>
              {tt("int.calendarHint")}
            </p>
            <Gate id="INT-02">
              <div className="ux-actions">
                <button className="btn" onClick={exportIcs}>
                  <Download size={16} aria-hidden /> {tt("cal.exportBtn")}
                </button>
              </div>
            </Gate>
            {realMode && (
              <div className="st-row st-foot" style={{ paddingBottom: 0 }}>
                <div className="st-row-main">
                  <b>{tt("cal.googleRow")}</b>
                  <p className="mute">{tt("cal.googleRowHint")}</p>
                </div>
                <Link className="ghost sm" href="/integrations/email">
                  {tt("profile.open")} <ChevronRight size={14} aria-hidden className="flip-rtl" />
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
