"use client";
import { useState } from "react";
import { Info, Mail, MailPlus, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseTaskText } from "@/lib/ai";
import { PRIORITY_LABEL } from "@/lib/mock-data";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import GoogleConnect from "@/components/GoogleConnect";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// INT-01: pasted email → task (rule-based reader in the browser — no inbox access)
export default function IntegrationEmail() {
  const { members, createTask, toast, openDrawer, allowed, realMode } = useStore();
  const canEdit = allowed("task.create");
  const { t: tt } = useT();
  const { project, picker, ready } = useProjectPicker();
  const [email, setEmail] = useState("");
  const subject = email.match(/^subject:\s*(.+)$/im)?.[1] ?? "";
  const body = email.split(/\n\s*\n/).slice(1).join(" ");
  const emailTask = parseTaskText(`${subject}. ${body}`.replace(/\s+/g, " "), members);

  return (
    <>
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[2]} hint={tt("em.hint")} />
      <div className="ux-page">
        <FeatureHero id="em-hero" icon={Mail} title={tt("em.heroTitle")} text={tt("em.heroText")} status="available" statusText={tt("ux.st.pasteOnly")} planId="INT-01" />
        <HowItWorks
          id="em-how"
          steps={[
            { title: tt("em.s1"), text: tt("em.s1t") },
            { title: tt("em.s2"), text: tt("em.s2t") },
            { title: tt("em.s3"), text: tt("em.s3t") },
          ]}
        />

        <div className="grid g2">
          <section className="card ux-sec" aria-labelledby="em-tool">
            <SecHead id="em-tool" icon={MailPlus} title={tt("int.emailTitle")}>
              {picker}
            </SecHead>
            <Gate id="INT-01">
              <div className="ux-form">
                <label>
                  {tt("em.pasteLabel")}
                  <textarea rows={6} dir="ltr" placeholder={"From: someone@example.com\nSubject: …\n\n…"} value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                {email.trim() && (
                  <div className="ux-result">
                    <div className="ux-pills">
                      <span className="ux-conf">{tt("ux.ruleBased")}</span>
                    </div>
                    <b>{emailTask.title || tt("int.noTitle")}</b>
                    <p className="mute" style={{ margin: 0, fontSize: 13 }}>
                      {PRIORITY_LABEL[emailTask.priority]} · {tt("int.dueIn", { n: emailTask.dueOffset })}
                    </p>
                  </div>
                )}
              </div>
              <div className="ux-actions" style={{ marginTop: 12 }}>
                <button
                  className="btn"
                  disabled={!emailTask.title || !canEdit || !ready}
                  onClick={() => {
                    const id = createTask({ projectId: project, title: emailTask.title, priority: emailTask.priority, dueOffset: emailTask.dueOffset, description: body, labels: ["Email"] });
                    toast(tt("int.taskFromEmail"));
                    openDrawer(id);
                  }}
                >
                  <Plus size={16} aria-hidden /> {tt("int.createTask")}
                </button>
              </div>
            </Gate>
            <p className="mute st-foot">
              <Info size={14} aria-hidden /> {tt("int.emailSimNote")}
            </p>
          </section>
          {realMode && <GoogleConnect />}
        </div>
      </div>
    </>
  );
}
