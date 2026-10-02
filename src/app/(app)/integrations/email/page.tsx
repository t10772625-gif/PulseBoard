"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { parseTaskText } from "@/lib/ai";
import { PRIORITY_LABEL } from "@/lib/mock-data";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import GoogleConnect from "@/components/GoogleConnect";
import SubPageHeader from "@/components/SubPageHeader";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// INT-01: pasted email → task (simulator — no Gmail connection)
export default function IntegrationEmail() {
  const { members, createTask, toast, openDrawer, canEdit: canEditTasks, allowed, realMode } = useStore();
  const canEdit = canEditTasks && allowed("automation.manage");
  const { t: tt } = useT();
  const { project, picker, ready } = useProjectPicker();
  const [email, setEmail] = useState("");
  const subject = email.match(/^subject:\s*(.+)$/im)?.[1] ?? "";
  const body = email.split(/\n\s*\n/).slice(1).join(" ");
  const emailTask = parseTaskText(`${subject}. ${body}`.replace(/\s+/g, " "), members);

  return (
    <>
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[2]} hint={tt("int.hint")} actions={picker} />
      <div className="grid g2">
        {realMode && <GoogleConnect />}
        <div className="card">
          <h2>{tt("int.emailTitle")}</h2>
          <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
            {tt("int.emailSimNote")}
          </p>
          <Gate id="INT-01">
            <textarea rows={5} dir="ltr" placeholder={"From: someone@example.com\nSubject: …\n\n…"} value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="mute" style={{ fontSize: 13, margin: "8px 0" }}>
              → <b>{emailTask.title || tt("int.noTitle")}</b> · {PRIORITY_LABEL[emailTask.priority]} · {tt("int.dueIn", { n: emailTask.dueOffset })}
            </p>
            <button
              className="btn sm"
              disabled={!emailTask.title || !canEdit || !ready}
              onClick={() => {
                const id = createTask({ projectId: project, title: emailTask.title, priority: emailTask.priority, dueOffset: emailTask.dueOffset, description: body, labels: ["Email"] });
                toast(tt("int.taskFromEmail"));
                openDrawer(id);
              }}
            >
              {tt("int.createTask")}
            </button>
          </Gate>
        </div>
      </div>
    </>
  );
}
