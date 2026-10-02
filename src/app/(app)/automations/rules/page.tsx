"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { AutomationRule } from "@/types";
import { AUTOMATION_GROUP, AUTOMATION_PAGES } from "@/lib/nav-groups";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { Switch } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

const TRIGGERS: Record<AutomationRule["trigger"], MessageKey> = {
  created: "auto.trCreated",
  priority_high: "auto.trHigh",
  status_done: "auto.trDone",
  assigned: "auto.trAssigned",
  overdue: "auto.trOverdue",
};
const ACTIONS: Record<AutomationRule["action"], MessageKey> = {
  notify_owner: "auto.acNotify",
  assign_me: "auto.acAssignMe",
  set_high: "auto.acHigh",
  add_label: "auto.acLabel",
  webhook: "auto.acWebhook",
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

export default function AutomationRules() {
  const { rules, addRule, toggleRule, removeRule, runOverdueRules, toast, allowed } = useStore();
  const canEdit = allowed("automation.manage");
  const { t: tt, rich } = useT();
  const [text, setText] = useState("");
  const [trigger, setTrigger] = useState<AutomationRule["trigger"]>("priority_high");
  const [action, setAction] = useState<AutomationRule["action"]>("notify_owner");
  const [param, setParam] = useState("");
  const parsed = text.trim() ? parseRule(text) : null;

  function add(rule: Omit<AutomationRule, "id" | "runs">) {
    if (rule.action === "webhook" && !validWebhook(rule.param ?? "")) return toast(tt("auto.badWebhook"));
    if (rule.action === "add_label" && !rule.param) return toast(tt("auto.enterLabel"));
    addRule(rule);
    toast(tt("auto.ruleAdded"));
  }

  return (
    <>
      <SubPageHeader group={AUTOMATION_GROUP} page={AUTOMATION_PAGES[0]} hint={tt("auto.hint")} />
      <Gate id="SPEC-21">
        <div className="grid g2">
          <div className="card">
            <h2>{tt("auto.describe")}</h2>
            <input placeholder={tt("auto.describePlaceholder")} value={text} onChange={(e) => setText(e.target.value)} />
            <p className="mute" style={{ fontSize: 12, marginTop: 4 }}>
              {tt("auto.describeLang")}
            </p>
            {text.trim() && (
              <p className="mute" style={{ fontSize: 13, margin: "8px 0" }}>
                {parsed ? (
                  <>
                    {rich("auto.when", { trigger: tt(TRIGGERS[parsed.trigger]), action: tt(ACTIONS[parsed.action]) })}
                    {parsed.param ? ` (${parsed.param})` : ""}
                  </>
                ) : (
                  tt("auto.cantParse")
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
              {tt("auto.createRule")}
            </button>

            <h3 style={{ marginTop: 18 }}>{tt("auto.orBuild")}</h3>
            <div className="f2">
              <label>
                {tt("auto.whenLabel")}
                <Dropdown value={trigger} onChange={setTrigger} options={(Object.keys(TRIGGERS) as AutomationRule["trigger"][]).map((k) => ({ value: k, label: tt(TRIGGERS[k]) }))} />
              </label>
              <label>
                {tt("auto.thenLabel")}
                <Dropdown value={action} onChange={setAction} options={(Object.keys(ACTIONS) as AutomationRule["action"][]).map((k) => ({ value: k, label: tt(ACTIONS[k]) }))} />
              </label>
            </div>
            {(action === "add_label" || action === "webhook") && (
              <input
                style={{ marginTop: 8 }}
                placeholder={action === "webhook" ? "https://hooks.example.com/pulse" : tt("auto.labelPlaceholder")}
                value={param}
                onChange={(e) => setParam(e.target.value)}
              />
            )}
            <button
              className="ghost sm"
              style={{ marginTop: 8 }}
              disabled={!canEdit}
              onClick={() => {
                add({ name: `${tt("auto.ruleName", { trigger: tt(TRIGGERS[trigger]), action: tt(ACTIONS[action]) })}${param ? ` (${param})` : ""}`, trigger, action, param: param || undefined, active: true });
                setParam("");
              }}
            >
              {tt("auto.addRule")}
            </button>
          </div>

          <div className="card">
            <div className="meta">
              <h2 style={{ margin: 0 }}>{tt("auto.rules")}</h2>
              <button
                className="ghost sm"
                onClick={() => {
                  const n = runOverdueRules();
                  toast(tt("auto.checked", { n }));
                }}
              >
                {tt("auto.runOverdue")}
              </button>
            </div>
            {rules.map((r) => (
              <div key={r.id} className="sugg">
                <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Switch label={tt("auto.ruleSwitch", { name: r.name })} checked={r.active} disabled={!canEdit} onChange={() => toggleRule(r.id)} />
                  <span>
                    <b>{r.name}</b>
                    <br />
                    <span className="mute" style={{ fontSize: 12 }}>
                      {tt(TRIGGERS[r.trigger])} → {tt(ACTIONS[r.action])} · {tt("auto.ran", { n: r.runs })}
                    </span>
                  </span>
                </span>
                <button className="ghost sm danger" disabled={!canEdit} onClick={() => removeRule(r.id)}>
                  {tt("common.remove")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </Gate>
    </>
  );
}
