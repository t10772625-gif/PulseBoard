"use client";
import { useStore } from "@/lib/store";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// Import a Trello board export (.json) into the chosen project
export default function IntegrationImport() {
  const { createTask, toast } = useStore();
  const { t: tt } = useT();
  const { project, picker, ready } = useProjectPicker();

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
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[5]} hint={tt("int.hint")} actions={picker} />
      <div className="grid g2">
        <div className="card">
          <h2>{tt("int.importTitle")}</h2>
          <Gate id="INT-02">
            <label className="ghost sm" style={{ cursor: ready ? "pointer" : "not-allowed", display: "inline-block", opacity: ready ? 1 : 0.6 }}>
              {tt("int.trello")}
              <input type="file" disabled={!ready} accept=".json,application/json" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && importTrello(e.target.files[0])} />
            </label>
            <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>
              {tt("int.otherTools")}
            </p>
          </Gate>
        </div>
      </div>
    </>
  );
}
