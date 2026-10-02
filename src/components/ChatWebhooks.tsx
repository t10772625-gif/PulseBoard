"use client";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { addChatWebhook, listChatWebhooks, removeChatWebhook, setChatWebhookActive, testChatWebhook, type ChatWebhook } from "@/lib/integrations";
import { Switch } from "./ui";
import Dropdown from "./Dropdown";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

const EVENTS: { key: string; label: MessageKey }[] = [
  { key: "task.created", label: "int.ev.created" },
  { key: "task.done", label: "int.ev.done" },
  { key: "task.high", label: "int.ev.high" },
  { key: "task.assigned", label: "int.ev.assigned" },
];

// Connect Slack / Discord channels with their incoming-webhook URL (real mode).
// The URL goes to the server once, gets encrypted, and is never shown again.
export default function ChatWebhooks() {
  const { workspaceId, allowed, toast } = useStore();
  const { t } = useT();
  const canManage = allowed("automation.manage");
  const [hooks, setHooks] = useState<ChatWebhook[]>([]);
  const [kind, setKind] = useState<"slack" | "discord">("slack");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["task.created", "task.done", "task.high"]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => listChatWebhooks(workspaceId).then(setHooks), [workspaceId]);
  useEffect(() => {
    if (workspaceId) void reload();
  }, [workspaceId, reload]);

  async function add() {
    if (!url.trim() || !events.length) return;
    setBusy(true);
    const res = await addChatWebhook(workspaceId, kind, url.trim(), events);
    setBusy(false);
    if (!res.ok) return toast(res.status === 400 ? t("int.badHookUrl") : res.status === 503 ? t("int.hookSetup") : t("store.saveFailed"));
    setUrl("");
    toast(t("int.hookAdded"));
    void reload();
  }

  return (
    <div className="card">
      <h2>{t("int.channelsTitle")}</h2>
      <p className="mute" style={{ fontSize: 12, marginBottom: 10 }}>
        {t("int.channelsHint")}
      </p>
      {hooks.map((h) => (
        <div key={h.id} className="sugg">
          <span style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
            <Switch
              label={t("int.hookActive")}
              checked={h.active}
              disabled={!canManage}
              onChange={async (v) => {
                if (await setChatWebhookActive(h.id, v)) void reload();
                else toast(t("store.saveFailed"));
              }}
            />
            <span>
              <b>{h.kind === "slack" ? "Slack" : "Discord"}</b> <span className="code" dir="ltr">{h.url_hint}</span>
              <br />
              <span className="mute" style={{ fontSize: 12 }}>
                {h.events.map((e) => t(EVENTS.find((x) => x.key === e)?.label ?? "int.ev.created")).join(" · ")}
              </span>
            </span>
          </span>
          <span style={{ display: "flex", gap: 6 }}>
            <button
              className="ghost sm"
              disabled={!canManage}
              onClick={async () => {
                const res = await testChatWebhook(workspaceId, h.id);
                toast(res.ok && res.data?.ok ? t("int.testSent") : t("int.testFailed"));
              }}
            >
              {t("int.test")}
            </button>
            <button
              className="ghost sm danger"
              disabled={!canManage}
              onClick={async () => {
                if (!window.confirm(t("int.hookRemoveConfirm"))) return;
                if (await removeChatWebhook(h.id)) void reload();
                else toast(t("store.saveFailed"));
              }}
            >
              {t("common.remove")}
            </button>
          </span>
        </div>
      ))}
      {!hooks.length && <p className="mute">{t("int.noChannels")}</p>}

      {canManage && (
        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          <div className="f2">
            <Dropdown value={kind} onChange={setKind} options={[{ value: "slack", label: "Slack" }, { value: "discord", label: "Discord" }]} />
            <input dir="ltr" placeholder={kind === "slack" ? "https://hooks.slack.com/services/…" : "https://discord.com/api/webhooks/…"} value={url} onChange={(e) => setUrl(e.target.value)} autoComplete="off" />
          </div>
          <div className="pill-row">
            {EVENTS.map((e) => (
              <label key={e.key} className="inline">
                <input type="checkbox" checked={events.includes(e.key)} onChange={() => setEvents((v) => (v.includes(e.key) ? v.filter((x) => x !== e.key) : [...v, e.key]))} />
                {t(e.label)}
              </label>
            ))}
          </div>
          <button className="btn sm" style={{ justifySelf: "start" }} disabled={busy || !url.trim() || !events.length} onClick={add}>
            {busy ? t("auth.wait") : t("int.connectChannel")}
          </button>
          <p className="mute" style={{ fontSize: 12 }}>
            {kind === "slack" ? t("int.slackHow") : t("int.discordHow")}
          </p>
        </div>
      )}
    </div>
  );
}
