"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CalendarClock, Clock, Info, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { AI_GROUP, AI_PAGES } from "@/lib/nav-groups";
import { freeBusy, googleConnectedMembers } from "@/lib/integrations";
import { MemberId } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// Busy hours per person for the DEMO calendar (AI-22); 9–17 working day
const DEMO_BUSY: Record<MemberId, number[]> = { me: [9, 13], ak: [10, 11, 15], ba: [9, 14], sm: [12, 16] };
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

// AI-22 meeting scheduler for tomorrow. Real mode: busy times come from the Google
// calendars people connected themselves (Integrations → Email); anyone not connected
// counts as unknown, and you can always pick the time by hand. Demo: sample calendars.
export default function AiMeetings() {
  const { members, createTask, toast, allowed, realMode, workspaceId, myUserId } = useStore();
  const canCreate = allowed("task.create");
  const { t: tt, rich, fmt } = useT();
  const { project, picker, ready } = useProjectPicker();
  const hourLabel = (h: number) => fmt.time(new Date(2026, 0, 1, h), { hour: "numeric", minute: "2-digit" });
  // Invitees start as just you; only people in this workspace are kept
  // (a real workspace has no demo "ak" / "ba", and looking them up crashed the page)
  const [picked, setInvitees] = useState<MemberId[]>(realMode ? ["me"] : ["me", "ak", "ba"]);
  const invitees = picked.filter((m) => members[m]);
  const [manualHour, setManualHour] = useState<number | null>(null);
  const [connected, setConnected] = useState<string[]>([]);
  const [busyHours, setBusyHours] = useState<Record<MemberId, number[]>>({});
  const uid = (m: MemberId) => (m === "me" ? myUserId : m);

  useEffect(() => {
    if (realMode && workspaceId) void googleConnectedMembers(workspaceId).then(setConnected);
  }, [realMode, workspaceId]);

  // Tomorrow, 00:00–24:00 in this browser's time zone
  const invKey = invitees.join(",");
  useEffect(() => {
    if (!realMode || !workspaceId || !connected.length) return;
    const people = invitees.map(uid).filter((u) => connected.includes(u));
    if (!people.length) return;
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    void freeBusy(workspaceId, people, start.toISOString(), end.toISOString()).then((res) => {
      const out: Record<MemberId, number[]> = {};
      for (const [u, blocks] of Object.entries(res.data?.busy ?? {})) {
        const member = u === myUserId ? "me" : u;
        out[member] = HOURS.filter((h) => {
          const a = new Date(start);
          a.setHours(h);
          const b = new Date(start);
          b.setHours(h + 1);
          return blocks.some((x) => new Date(x.start) < b && new Date(x.end) > a);
        });
      }
      setBusyHours(out);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run when the invitee list or connections change
  }, [realMode, workspaceId, invKey, connected.join(","), myUserId]);

  const busy = realMode ? busyHours : DEMO_BUSY;
  const known = invitees.filter((m) => !realMode || busyHours[m]);
  const suggested = HOURS.find((h) => invitees.every((m) => !(busy[m] ?? []).includes(h)));
  const slot = manualHour ?? suggested;

  return (
    <>
      <SubPageHeader group={AI_GROUP} page={AI_PAGES[4]} hint={tt("aiPage.hint")} />
      <div className="ux-page">
        <FeatureHero
          id="mt-hero"
          icon={CalendarClock}
          title={tt("mt.heroTitle")}
          text={realMode ? tt("mt.heroTextReal") : tt("mt.heroTextDemo")}
          status={realMode ? "available" : "setup"}
          statusText={realMode ? tt("ux.ruleBased") : tt("mt.demoCalendars")}
          planId="AI-22"
        >
          <div className="ux-pills">{picker}</div>
        </FeatureHero>
        <HowItWorks
          id="mt-how"
          steps={[
            { title: tt("mt.s1"), text: tt("mt.s1t") },
            { title: tt("mt.s2"), text: tt("mt.s2t") },
            { title: tt("mt.s3"), text: tt("mt.s3t") },
          ]}
        />

        <section className="card ux-sec" aria-labelledby="mt-tool">
          <SecHead id="mt-tool" icon={CalendarCheck} title={tt("aiPage.scheduler")}>
            <span className="ux-conf">{tt("mt.tomorrow")}</span>
          </SecHead>
          <Gate id="AI-22">
            <div className="ux-form">
              <div className="ux-sec" style={{ gap: 8 }}>
                <b style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
                  <Users size={16} aria-hidden /> {tt("mt.invitees")}
                </b>
                <div className="pill-row">
                  {(Object.keys(members) as MemberId[]).map((m) => (
                    <label key={m} className="inline" title={realMode && connected.includes(uid(m)) ? tt("aiPage.calConnected") : undefined}>
                      <input type="checkbox" checked={invitees.includes(m)} onChange={() => setInvitees((v) => (v.includes(m) ? v.filter((x) => x !== m) : [...v, m]))} />
                      {members[m].name.split(" ")[0]}
                      {realMode && connected.includes(uid(m)) ? " 📅" : ""}
                    </label>
                  ))}
                </div>
              </div>

              <div className="ux-result" style={{ marginTop: 0 }}>
                <span className="ux-actor">
                  <Clock size={16} aria-hidden /> {suggested !== undefined ? <span>{rich("aiPage.freeAt", { time: hourLabel(suggested) })}</span> : <span>{tt("aiPage.noFree")}</span>}
                </span>
                {realMode && invitees.length > known.length && (
                  <p className="mute" style={{ margin: 0, fontSize: 12 }}>
                    {tt("aiPage.unknownBusy", { n: invitees.length - known.length })}
                  </p>
                )}
              </div>

              <div className="ux-inline">
                <label style={{ flex: "0 1 220px" }}>
                  {tt("aiPage.pickTime")}
                  <Dropdown value={String(slot ?? "")} onChange={(v) => setManualHour(Number(v))} options={HOURS.map((h) => ({ value: String(h), label: hourLabel(h) }))} />
                </label>
                {slot !== undefined && canCreate && (
                  <button
                    className="btn"
                    disabled={!ready}
                    onClick={() => {
                      createTask({ projectId: project, title: tt("aiPage.meetingTitle", { time: hourLabel(slot) }), dueOffset: 1, labels: ["Meeting"], description: tt("aiPage.invitees", { names: invitees.map((m) => members[m].name).join(", ") }) });
                      toast(tt("aiPage.meetingAdded"));
                    }}
                  >
                    <CalendarCheck size={16} aria-hidden /> {tt("aiPage.book")}
                  </button>
                )}
              </div>
            </div>
            <p className="mute st-foot">
              <Info size={14} aria-hidden /> {realMode ? tt("aiPage.realCalendars") : tt("aiPage.demoCalendars")}{" "}
              {realMode && (
                <Link className="link" href="/integrations/email">
                  {tt("aiPage.connectCalendar")}
                </Link>
              )}
            </p>
          </Gate>
        </section>
      </div>
    </>
  );
}
