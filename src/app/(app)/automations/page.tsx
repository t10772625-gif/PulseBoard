"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { AutomationRule } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import { SettingRow, Switch } from "@/components/ui";

const TRIGGERS: Record<AutomationRule["trigger"], string> = {
  created: "a task is created",
  priority_high: "a task becomes high priority",
  status_done: "a task is completed",
  assigned: "a task is reassigned",
  overdue: "a task is overdue (run manually)",
};
const ACTIONS: Record<AutomationRule["action"], string> = {
  notify_owner: "notify me",
  assign_me: "assign it to me",
  set_high: "set priority to high",
  add_label: "add a label",
  webhook: "send a webhook",
};

// "When a bug becomes P0, notify me" → rule (SPEC-21 natural-language builder)
function parseRule(text: string): Omit<AutomationRule, "id" | "runs"> | null {
  const t = text.toLowerCase();
  const trigger: AutomationRule["trigger"] | null = /high|p0|urgent|critical/.test(t)
    ? "priority_high"
    : /done|complete|finish/.test(t)
      ? "status_done"
      : /overdue|late/.test(t)
        ? "overdue"
        : /assign/.test(t) && !/assign (it )?to me/.test(t)
          ? "assigned"
          : /creat|new/.test(t)
            ? "created"
            : null;
  const label = t.match(/label\s+"?([\w-]+)"?/);
  const url = text.match(/https?:\/\/\S+/);
  const action: AutomationRule["action"] | null = url
    ? "webhook"
    : label
      ? "add_label"
      : /assign (it )?to me/.test(t)
        ? "assign_me"
        : /set (it )?(to )?high|make (it )?high/.test(t)
          ? "set_high"
          : /notify|alert|tell|ping/.test(t)
            ? "notify_owner"
            : null;
  if (!trigger || !action) return null;
  return { name: text.trim(), trigger, action, param: url?.[0] ?? label?.[1], active: true };
}

const EMAIL_TEMPLATES = [
  { name: "HR — Interview scheduled", body: "Hi {{name}}, your interview is scheduled for {{date}}. Reply to this email if you need another time." },
  { name: "Client — Project update", body: "Hi {{client}}, your project is {{progress}}% complete. Highlights this week: {{highlights}}." },
  { name: "Sales — Follow-up", body: "Hi {{name}}, thanks for the call on {{date}}. Here is the proposal we discussed." },
];

export default function Automations() {
  const { rules, addRule, toggleRule, removeRule, runOverdueRules, webhookLog, tasks, digestMode, setDigestMode, toast, openDrawer, allowed } = useStore();
  const canEdit = allowed("automation.manage");
  const [text, setText] = useState("");
  const [trigger, setTrigger] = useState<AutomationRule["trigger"]>("priority_high");
  const [action, setAction] = useState<AutomationRule["action"]>("notify_owner");
  const [param, setParam] = useState("");
  const [tpl, setTpl] = useState(0);
  const [vars, setVars] = useState<Record<string, string>>({ name: "Ali Khan", date: "Friday 10 AM", client: "Northwind", progress: "72", highlights: "hero section shipped" });
  const recurring = tasks.filter((t) => t.recurrence && t.recurrence !== "none");
  const parsed = text.trim() ? parseRule(text) : null;

  function validWebhook(u: string) {
    // SSRF guard: https only, no localhost / private ranges (ADV-04)
    try {
      const url = new URL(u);
      if (url.protocol !== "https:") return false;
      return !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[?::1\]?$)/.test(url.hostname);
    } catch {
      return false;
    }
  }

  function add(rule: Omit<AutomationRule, "id" | "runs">) {
    if (rule.action === "webhook" && !validWebhook(rule.param ?? "")) return toast("Webhook URL must be a public https:// address");
    if (rule.action === "add_label" && !rule.param) return toast("Enter the label to add");
    addRule(rule);
    toast("Rule added");
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>Automations</h1>
          <p className="mute">Rules run automatically when tasks change. Changes made by a rule never trigger another rule.</p>
        </div>
      </div>

      <Gate id="SPEC-21">
        <div className="grid g2" style={{ marginBottom: 18 }}>
          <div className="card">
            <h2>Describe a rule</h2>
            <input placeholder='e.g. "When a task becomes high priority, notify me"' value={text} onChange={(e) => setText(e.target.value)} />
            {text.trim() && (
              <p className="mute" style={{ fontSize: 13, margin: "8px 0" }}>
                {parsed ? (
                  <>
                    When <b>{TRIGGERS[parsed.trigger]}</b> → <b>{ACTIONS[parsed.action]}</b>
                    {parsed.param ? ` (${parsed.param})` : ""}
                  </>
                ) : (
                  "Couldn't understand that yet — try the builder below."
                )}
              </p>
            )}
            <button
              className="btn sm"
              disabled={!parsed || !canEdit}
              onClick={() => {
                if (parsed) add(parsed);
                setText("");
              }}
            >
              Create rule
            </button>

            <h3 style={{ marginTop: 18 }}>Or build it</h3>
            <div className="f2">
              <label>
                When
                <Dropdown value={trigger} onChange={setTrigger} options={(Object.keys(TRIGGERS) as AutomationRule["trigger"][]).map((k) => ({ value: k, label: TRIGGERS[k] }))} />
              </label>
              <label>
                Then
                <Dropdown value={action} onChange={setAction} options={(Object.keys(ACTIONS) as AutomationRule["action"][]).map((k) => ({ value: k, label: ACTIONS[k] }))} />
              </label>
            </div>
            {(action === "add_label" || action === "webhook") && (
              <input
                style={{ marginTop: 8 }}
                placeholder={action === "webhook" ? "https://hooks.example.com/pulse" : "Label, e.g. Escalated"}
                value={param}
                onChange={(e) => setParam(e.target.value)}
              />
            )}
            <button
              className="ghost sm"
              style={{ marginTop: 8 }}
              disabled={!canEdit}
              onClick={() => {
                add({ name: `When ${TRIGGERS[trigger]}, ${ACTIONS[action]}${param ? ` (${param})` : ""}`, trigger, action, param: param || undefined, active: true });
                setParam("");
              }}
            >
              Add rule
            </button>
          </div>

          <div className="card">
            <div className="meta">
              <h2 style={{ margin: 0 }}>Rules</h2>
              <button
                className="ghost sm"
                onClick={() => {
                  const n = runOverdueRules();
                  toast(`Checked ${n} overdue task(s)`);
                }}
              >
                Run overdue rules now
              </button>
            </div>
            {rules.map((r) => (
              <div key={r.id} className="sugg">
                <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Switch label={`Rule ${r.name}`} checked={r.active} disabled={!canEdit} onChange={() => toggleRule(r.id)} />
                  <span>
                    <b>{r.name}</b>
                    <br />
                    <span className="mute" style={{ fontSize: 12 }}>
                      {TRIGGERS[r.trigger]} → {ACTIONS[r.action]} · ran {r.runs}×
                    </span>
                  </span>
                </span>
                <button className="ghost sm danger" disabled={!canEdit} onClick={() => removeRule(r.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </Gate>

      <div className="grid g2">
        <div className="card">
          <h2>Webhook deliveries</h2>
          <Gate id="ADV-04">
            <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
              Deliveries are logged here. Actually sending requests needs the backend (it signs each request with HMAC and retries on failure).
            </p>
            {webhookLog.length ? (
              webhookLog.map((w) => (
                <div key={w.id} className="sugg">
                  <span className="code">{w.url}</span>
                  <span className="mute" style={{ fontSize: 12 }}>
                    {w.event} · {new Date(w.at).toLocaleTimeString()} · {w.ok ? "queued" : "no URL"}
                  </span>
                </div>
              ))
            ) : (
              <p className="mute">No deliveries yet. Add a webhook rule and trigger it.</p>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>Notifications</h2>
          <Gate id="NOTIF-03">
            <SettingRow title="Smart digest" hint="Only high-priority and overdue alerts pop up in real time; everything else waits in the inbox.">
              <Switch label="Smart digest" checked={digestMode} onChange={setDigestMode} />
            </SettingRow>
          </Gate>
          <button
            className="ghost sm"
            style={{ marginTop: 12 }}
            onClick={async () => {
              if (!("Notification" in window)) return toast("This browser doesn't support notifications");
              const p = await window.Notification.requestPermission();
              toast(p === "granted" ? "Browser notifications on" : "Permission not granted");
            }}
          >
            Enable browser notifications
          </button>
        </div>

        <div className="card">
          <h2>Email templates</h2>
          <Gate id="NOTIF-01">
            <Dropdown value={String(tpl)} onChange={(v) => setTpl(Number(v))} options={EMAIL_TEMPLATES.map((t, i) => ({ value: String(i), label: t.name }))} />
            <div className="f2" style={{ margin: "10px 0" }}>
              {Array.from(EMAIL_TEMPLATES[tpl].body.matchAll(/{{(\w+)}}/g), (m) => m[1]).map((v) => (
                <label key={v}>
                  {v}
                  <input value={vars[v] ?? ""} onChange={(e) => setVars({ ...vars, [v]: e.target.value })} />
                </label>
              ))}
            </div>
            <pre className="doc-pre">{EMAIL_TEMPLATES[tpl].body.replace(/{{(\w+)}}/g, (_, k) => vars[k] || `{{${k}}}`)}</pre>
            <button
              className="ghost sm"
              onClick={() => {
                navigator.clipboard?.writeText(EMAIL_TEMPLATES[tpl].body.replace(/{{(\w+)}}/g, (_, k) => vars[k] || ""));
                toast("Email copied");
              }}
            >
              Copy email
            </button>
          </Gate>
        </div>

        <div className="card">
          <h2>Recurring tasks</h2>
          <Gate id="CORE-11">
            {recurring.length ? (
              recurring.map((t) => (
                <button key={t.id} className="row" onClick={() => openDrawer(t.id)}>
                  <span>{t.title}</span>
                  <span className="chip">🔁 {t.recurrence}</span>
                </button>
              ))
            ) : (
              <p className="mute">None yet. Set &quot;Repeats&quot; on any task.</p>
            )}
          </Gate>
        </div>
      </div>
    </>
  );
}
