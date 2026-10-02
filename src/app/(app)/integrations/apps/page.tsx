"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import { googleConnection, listChatWebhooks, serverSetup, type ChatWebhook, type GoogleConnection, type ServerSetup } from "@/lib/integrations";
import { PlanTag } from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

type Status = "connected" | "available" | "setup" | "decision" | "planned";

const CATALOG: { key: string; name: string; desc: MessageKey; feature: string; note?: MessageKey; href?: string }[] = [
  { key: "slack", name: "Slack", desc: "int.slackDesc", feature: "INT-02", href: "/integrations/slack" },
  { key: "discord", name: "Discord", desc: "int.discordDesc", feature: "INT-02", href: "/integrations/slack" },
  { key: "gmail", name: "Gmail", desc: "int.gmailSendDesc", feature: "INT-01", href: "/integrations/email" },
  { key: "gcal", name: "Google Calendar", desc: "int.gcalDesc", feature: "INT-02", href: "/integrations/calendar" },
  { key: "github", name: "GitHub", desc: "int.githubDesc", feature: "DEV-01", href: "/integrations/github" },
  { key: "telegram", name: "Telegram", desc: "int.telegramDesc", feature: "INT-02" },
  { key: "drive", name: "Google Drive", desc: "int.driveDesc", feature: "INT-02" },
  { key: "zapier", name: "Zapier / Make / IFTTT", desc: "int.zapierDesc", feature: "INT-02" },
  { key: "whatsapp", name: "WhatsApp Business", desc: "int.whatsappDesc", feature: "INT-02-PAID", note: "int.whatsappNote" },
];

const STATUS_KEY: Record<Status, MessageKey> = {
  connected: "int.st.connected",
  available: "int.st.available",
  setup: "int.st.setup",
  decision: "int.st.decision",
  planned: "int.st.planned",
};

// Real status of each connection (demo mode keeps the old preview toggles)
export default function IntegrationApps() {
  const { integrations, toggleIntegration, can, canEdit: canEditTasks, allowed, realMode, workspaceId } = useStore();
  const canEdit = canEditTasks && allowed("automation.manage");
  const { t: tt } = useT();
  const [setup, setSetup] = useState<ServerSetup | null>(null);
  const [hooks, setHooks] = useState<ChatWebhook[]>([]);
  const [google, setGoogle] = useState<GoogleConnection>(null);

  useEffect(() => {
    if (!realMode || !workspaceId) return;
    void serverSetup().then(setSetup);
    void listChatWebhooks(workspaceId).then(setHooks);
    void googleConnection().then(setGoogle);
  }, [realMode, workspaceId]);

  function status(key: string): Status {
    if (key === "slack" || key === "discord") return hooks.some((h) => h.kind === key) ? "connected" : setup?.chatWebhooks ? "available" : "setup";
    if (key === "gmail") return google ? "connected" : setup?.google || setup?.email ? "available" : "setup";
    if (key === "gcal") return "available"; // the subscription feed needs no setup
    if (key === "github" || key === "telegram") return "decision";
    return "planned";
  }

  return (
    <>
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[0]} hint={realMode ? tt("int.hintReal") : tt("int.hint")} />
      <div className="grid g3">
        {CATALOG.map((c) => {
          const st = realMode ? status(c.key) : null;
          return (
            <div key={c.key} className="card">
              <div className="meta">
                <b>
                  {c.name}
                  <PlanTag id={c.feature} />
                </b>
                {st ? (
                  <span className={`int-st ${st}`}>{tt(STATUS_KEY[st])}</span>
                ) : (
                  <button className={integrations[c.key] ? "btn sm" : "ghost sm"} disabled={!can(c.feature) || !canEdit} onClick={() => toggleIntegration(c.key)}>
                    {!can(c.feature) ? "🔒" : integrations[c.key] ? tt("int.connectedDemo") : tt("int.connect")}
                  </button>
                )}
              </div>
              <p className="mute" style={{ fontSize: 13, marginTop: 6 }}>
                {tt(c.desc)}
              </p>
              {c.key === "gmail" && google && (
                <p className="mute" style={{ fontSize: 12, marginTop: 4 }} dir="ltr">
                  {google.account_email}
                </p>
              )}
              {(c.key === "slack" || c.key === "discord") && hooks.some((h) => h.kind === c.key) && (
                <p className="mute" style={{ fontSize: 12, marginTop: 4 }}>
                  {tt("int.channels", { n: hooks.filter((h) => h.kind === c.key).length })}
                </p>
              )}
              {c.note && (
                <p className="mute" style={{ fontSize: 11, marginTop: 4 }}>
                  ⚠️ {tt(c.note)}
                </p>
              )}
              {realMode && c.href && can(c.feature) && (
                <Link className="ghost sm" href={c.href} style={{ marginTop: 8, display: "inline-block" }}>
                  {tt("int.manage")}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
