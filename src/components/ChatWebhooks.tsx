"use client";
import { useCallback, useEffect, useState } from "react";
import { Info, MessagesSquare, Plus, Send, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { addChatWebhook, listChatWebhooks, removeChatWebhook, setChatWebhookActive, testChatWebhook, type ChatWebhook } from "@/lib/integrations";
import { EmptyState, Switch } from "./ui";
import Dropdown from "./Dropdown";
import { SecHead } from "./FeaturePage";
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
  const canConnect = allowed("integration.connect");
  const canManage = allowed("integration.edit");
  const canDisconnect = allowed("integration.disconnect");
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
    <section className="card ux-sec" aria-labelledby="cw-h">
      <SecHead id="cw-h" icon={MessagesSquare} title={t("int.channelsTitle")}>
        {hooks.length > 0 && <span className="int-st connected">{t("int.channels", { n: hooks.length })}</span>}
      </SecHead>
      <p className="mute" style={{ margin: 0, fontSize: 13 }}>
        {t("int.channelsHint")}
      </p>
      {hooks.length ? (
        <div className="ux-rows">
          {hooks.map((h) => (
            <div key={h.id} className="st-row" style={{ flexWrap: "wrap" }}>
              <Switch
                label={t("int.hookActive")}
                checked={h.active}
                disabled={!canManage}
                onChange={async (v) => {
                  if (await setChatWebhookActive(h.id, v)) void reload();
                  else toast(t("store.saveFailed"));
                }}
              />
              <div className="st-row-main">
                <b>{h.kind === "slack" ? "Slack" : "Discord"}</b>{" "}
                <span className="code" dir="ltr">
                  {h.url_hint}
                </span>
                <p className="mute">{h.events.map((e) => t(EVENTS.find((x) => x.key === e)?.label ?? "int.ev.created")).join(" · ")}</p>
              </div>
              <div className="ux-actions">
                <button
                  className="ghost sm"
                  disabled={!canManage}
                  onClick={async () => {
                    const res = await testChatWebhook(workspaceId, h.id);
                    toast(res.ok && res.data?.ok ? t("int.testSent") : t("int.testFailed"));
                  }}
                >
                  <Send size={14} aria-hidden /> {t("int.test")}
                </button>
                <button
                  className="ghost sm danger"
                  disabled={!canDisconnect}
                  onClick={async () => {
                    if (!window.confirm(t("int.hookRemoveConfirm"))) return;
                    if (await removeChatWebhook(h.id)) void reload();
                    else toast(t("store.saveFailed"));
                  }}
                >
                  <Trash2 size={14} aria-hidden /> {t("common.remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState compact icon={<MessagesSquare size={26} />} title={t("int.noChannels")} />
      )}

      {canConnect && (
        <div className="ux-result">
          <div className="ux-form-2">
            <label>
              {t("cw.app")}
              <Dropdown value={kind} onChange={setKind} options={[{ value: "slack", label: "Slack" }, { value: "discord", label: "Discord" }]} />
            </label>
            <label>
              {t("cw.url")}
              <input dir="ltr" placeholder={kind === "slack" ? "https://hooks.slack.com/services/…" : "https://discord.com/api/webhooks/…"} value={url} onChange={(e) => setUrl(e.target.value)} autoComplete="off" />
            </label>
          </div>
          <div className="pill-row">
            {EVENTS.map((e) => (
              <label key={e.key} className="inline">
                <input type="checkbox" checked={events.includes(e.key)} onChange={() => setEvents((v) => (v.includes(e.key) ? v.filter((x) => x !== e.key) : [...v, e.key]))} />
                {t(e.label)}
              </label>
            ))}
          </div>
          <div className="ux-actions">
            <button className="btn" disabled={busy || !url.trim() || !events.length} onClick={add}>
              <Plus size={16} aria-hidden /> {busy ? t("auth.wait") : t("int.connectChannel")}
            </button>
          </div>
          <p className="mute" style={{ margin: 0, fontSize: 12, display: "flex", gap: 6 }}>
            <Info size={14} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} /> {kind === "slack" ? t("int.slackHow") : t("int.discordHow")}
          </p>
        </div>
      )}
    </section>
  );
}
