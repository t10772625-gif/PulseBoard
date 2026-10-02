"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { AUTOMATION_GROUP, AUTOMATION_PAGES } from "@/lib/nav-groups";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

// Bodies are stored with [[var]] in the language files (ICU uses single braces);
// they become {{var}} for the template engine below.
const EMAIL_TEMPLATES: { name: MessageKey; body: MessageKey }[] = [
  { name: "auto.tplHrName", body: "auto.tplHrBody" },
  { name: "auto.tplClientName", body: "auto.tplClientBody" },
  { name: "auto.tplSalesName", body: "auto.tplSalesBody" },
];

// NOTIF-01 email templates: fill in and copy (nothing is sent from here)
export default function AutomationEmailTemplates() {
  const { toast } = useStore();
  const { t: tt } = useT();
  const templateBody = (i: number) => tt(EMAIL_TEMPLATES[i].body).replace(/\[\[(\w+)\]\]/g, "{{$1}}");
  const [tpl, setTpl] = useState(0);
  // Values you type to fill the template ({{name}}, {{date}} …); nothing is pre-filled
  const [vars, setVars] = useState<Record<string, string>>({});

  return (
    <>
      <SubPageHeader group={AUTOMATION_GROUP} page={AUTOMATION_PAGES[3]} hint={tt("auto.hint")} />
      <div className="grid g2">
        <div className="card">
          <h2>{tt("auto.emailTemplates")}</h2>
          <Gate id="NOTIF-01">
            <Dropdown value={String(tpl)} onChange={(v) => setTpl(Number(v))} options={EMAIL_TEMPLATES.map((t, i) => ({ value: String(i), label: tt(t.name) }))} />
            <div className="f2" style={{ margin: "10px 0" }}>
              {Array.from(templateBody(tpl).matchAll(/{{(\w+)}}/g), (m) => m[1]).map((v) => (
                <label key={v}>
                  {v}
                  <input value={vars[v] ?? ""} onChange={(e) => setVars({ ...vars, [v]: e.target.value })} />
                </label>
              ))}
            </div>
            <pre className="doc-pre">{templateBody(tpl).replace(/{{(\w+)}}/g, (_, k) => vars[k] || `{{${k}}}`)}</pre>
            <button
              className="ghost sm"
              onClick={() => {
                navigator.clipboard?.writeText(templateBody(tpl).replace(/{{(\w+)}}/g, (_, k) => vars[k] || ""));
                toast(tt("auto.emailCopied"));
              }}
            >
              {tt("auto.copyEmail")}
            </button>
          </Gate>
        </div>
      </div>
    </>
  );
}
