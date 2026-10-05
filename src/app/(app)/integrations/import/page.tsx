"use client";
import { useRef } from "react";
import { FileJson, FileUp, Info, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// Import a Trello board export (.json) into the chosen board. Runs in the browser:
// the file is read locally and each open card becomes a task (normal create rules apply).
export default function IntegrationImport() {
  const { createTask, toast, allowed } = useStore();
  const canCreate = allowed("task.create");
  const { t: tt } = useT();
  const { project, picker, ready } = useProjectPicker();
  const fileRef = useRef<HTMLInputElement>(null);

  function importTrello(file: File) {
    file.text().then((txt) => {
      try {
        const data = JSON.parse(txt) as { lists?: { id: string; name: string; closed?: boolean }[]; cards?: { name: string; desc?: string; idList: string; closed?: boolean; labels?: { name: string }[] }[] };
        const lists = Object.fromEntries((data.lists ?? []).map((l) => [l.id, l.name.toLowerCase()]));
        let n = 0;
        for (const c of data.cards ?? []) {
          if (c.closed) continue;
          const list = lists[c.idList] ?? "";
          createTask({
            projectId: project,
            title: c.name,
            description: c.desc ?? "",
            status: /done|complete/.test(list) ? "done" : /doing|progress/.test(list) ? "prog" : "todo",
            labels: (c.labels ?? []).map((l) => l.name).filter(Boolean).concat("Trello"),
          });
          n++;
        }
        toast(tt("int.importedTrello", { n }));
      } catch {
        toast(tt("int.notTrello"));
      }
    });
  }

  return (
    <>
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[5]} hint={tt("imp.hint")} />
      <div className="ux-page">
        <FeatureHero id="imp-hero" icon={FileUp} title={tt("imp.heroTitle")} text={tt("imp.heroText")} status="available" statusText={tt("ux.st.available")} planId="INT-02" />
        <HowItWorks
          id="imp-how"
          steps={[
            { title: tt("imp.s1"), text: tt("imp.s1t") },
            { title: tt("imp.s2"), text: tt("imp.s2t") },
            { title: tt("imp.s3"), text: tt("imp.s3t") },
          ]}
        />
        <section className="card ux-sec" aria-labelledby="imp-tool">
          <SecHead id="imp-tool" icon={FileJson} title={tt("int.importTitle")}>
            {picker}
          </SecHead>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {ready ? tt("imp.toolHint") : tt("imp.needBoard")}
          </p>
          <Gate id="INT-02">
            <div className="ux-actions">
              <button className="btn" disabled={!ready || !canCreate} onClick={() => fileRef.current?.click()}>
                <Upload size={16} aria-hidden /> {tt("imp.trelloBtn")}
              </button>
              <input ref={fileRef} type="file" hidden accept=".json,application/json" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importTrello(f);
                e.target.value = "";
              }} />
            </div>
            <p className="mute st-foot">
              <Info size={14} aria-hidden /> {tt("int.otherTools")}
            </p>
          </Gate>
        </section>
      </div>
    </>
  );
}
