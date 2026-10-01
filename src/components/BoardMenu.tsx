"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { BOARD_TEMPLATES, dateForOffset, offsetForDate, TODAY } from "@/lib/mock-data";
import { download, parseCsv, toCsv } from "@/lib/csv";
import { MemberId, Priority, ProjectId } from "@/types";
import Modal from "./Modal";
import Gate from "./Gate";
import { useT } from "@/i18n/I18nProvider";

// Import/export and templates for one board (CORE-03, CORE-08, CORE-09, CORE-10).
export default function BoardMenu({ projectId, onClose }: { projectId: ProjectId; onClose: () => void }) {
  const { tasks, projects, members, getColumns, columnLabel, createTask, templates, applyTemplate, saveTemplate, applyBoardTemplate, toast, createShareLink, shareLinks, revokeShareLink } = useStore();
  const { t: tt } = useT();
  const [tplName, setTplName] = useState("");
  const [preview, setPreview] = useState<string[][] | null>(null);
  const project = projects[projectId];
  const cols = getColumns(projectId);

  function exportCsv() {
    const rows = tasks
      .filter((t) => t.projectId === projectId)
      .map((t) => {
        const d = new Date(TODAY);
        d.setDate(d.getDate() + t.dueOffset);
        return [t.title, columnLabel(projectId, t.status), t.priority, members[t.assignee].name, d.toISOString().slice(0, 10), t.labels.join(";"), t.description];
      });
    download(`${project.name}.csv`, toCsv([["Title", "Status", "Priority", "Assignee", "Due", "Labels", "Description"], ...rows]));
    toast(tt("boardMenu.exported", { n: rows.length }));
  }

  function onFile(file: File) {
    file.text().then((text) => {
      const rows = parseCsv(text);
      if (rows.length < 2) return toast(tt("boardMenu.noRows"));
      setPreview(rows);
    });
  }

  function importRows() {
    if (!preview) return;
    const header = preview[0].map((h) => h.trim().toLowerCase());
    const col = (name: string) => header.findIndex((h) => h.includes(name));
    const [iTitle, iStatus, iPri, iAss, iDue, iLab, iDesc] = ["title", "status", "priority", "assignee", "due", "label", "desc"].map(col);
    if (iTitle < 0) return toast(tt("boardMenu.needTitle"));
    let n = 0;
    for (const r of preview.slice(1)) {
      const title = r[iTitle]?.trim();
      if (!title) continue;
      const statusText = (r[iStatus] ?? "").trim().toLowerCase();
      const status = cols.find(([s, l]) => l.toLowerCase() === statusText || s === statusText)?.[0] ?? "todo";
      const p = (r[iPri] ?? "").trim().toLowerCase()[0];
      const priority: Priority = p === "h" ? "h" : p === "l" ? "l" : "m";
      const assName = (r[iAss] ?? "").trim().toLowerCase();
      const assignee = (Object.keys(members) as MemberId[]).find((m) => members[m].name.toLowerCase().startsWith(assName) && assName) ?? "me";
      const due = r[iDue] && !isNaN(Date.parse(r[iDue])) ? offsetForDate(r[iDue]) : 7;
      createTask({
        projectId,
        title,
        status,
        priority,
        assignee,
        dueOffset: due,
        labels: iLab >= 0 && r[iLab] ? r[iLab].split(/[;|]/).map((s) => s.trim()).filter(Boolean) : [tt("boardMenu.importedLabel")],
        description: iDesc >= 0 ? r[iDesc] ?? "" : "",
      });
      n++;
    }
    toast(tt("boardMenu.imported", { n }));
    setPreview(null);
    onClose();
  }

  return (
    <Modal title={tt("boardMenu.title", { name: project.name })} onClose={onClose}>
      <div style={{ display: "grid", gap: 18 }}>
        <section>
          <h3>{tt("boardMenu.importExport")}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="ghost" onClick={exportCsv}>
              {tt("boardMenu.exportCsv")}
            </button>
            <label className="ghost" style={{ cursor: "pointer" }}>
              {tt("boardMenu.importCsv")}
              <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </label>
          </div>
          {preview && (
            <div className="card" style={{ marginTop: 10, padding: 10 }}>
              <p className="mute">{tt("boardMenu.preview", { n: preview.length - 1, columns: preview[0].join(", ") })}</p>
              <button className="btn" style={{ marginTop: 8 }} onClick={importRows}>
                {tt("boardMenu.createN", { n: preview.length - 1 })}
              </button>
            </div>
          )}
          <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>
            {tt("boardMenu.csvHelp", { today: dateForOffset(0) })}
          </p>
        </section>

        <section>
          <h3>{tt("boardMenu.taskTemplates")}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {templates.map((t) => (
              <button
                key={t.id}
                className="ghost"
                onClick={() => {
                  const n = applyTemplate(t.id, projectId);
                  toast(tt("boardMenu.addedFromTpl", { n, name: t.name }));
                  onClose();
                }}
              >
                ＋ {t.name} ({t.tasks.length})
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input placeholder={tt("boardMenu.saveAsTpl")} value={tplName} onChange={(e) => setTplName(e.target.value)} />
            <button
              className="btn"
              onClick={() => {
                if (!tplName.trim()) return toast(tt("boardMenu.nameTpl"));
                saveTemplate(tplName.trim(), projectId);
                setTplName("");
                toast(tt("boardMenu.tplSaved"));
              }}
            >
              {tt("common.save")}
            </button>
          </div>
        </section>

        <section>
          <h3>{tt("boardMenu.shareEmbed")}</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <Gate id="COL-05">
              <button
                className="ghost"
                onClick={() => {
                  const token = createShareLink("board", projectId);
                  navigator.clipboard?.writeText(`${window.location.origin}/share/${token}`);
                  toast(tt("boardMenu.boardLinkCopied"));
                }}
              >
                {tt("boardMenu.copyBoardLink")}
              </button>
            </Gate>
            <Gate id="SPEC-26">
              <button
                className="ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/submit/${projectId}`);
                  toast(tt("boardMenu.formCopied"));
                }}
              >
                {tt("boardMenu.copyForm")}
              </button>
            </Gate>
            <Gate id="COL-06">
              <p className="code" dir="ltr">{`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/${projectId}" width="100%" height="420" style="border:0"></iframe>`}</p>
            </Gate>
            {shareLinks.filter((l) => !l.revoked && l.targetId === projectId).length > 0 && (
              <div>
                {shareLinks
                  .filter((l) => !l.revoked && l.targetId === projectId)
                  .map((l) => (
                    <div key={l.token} className="sugg">
                      <span className="code">/share/{l.token.slice(0, 10)}…</span>
                      <button className="ghost sm danger" onClick={() => revokeShareLink(l.token)}>
                        {tt("boardMenu.revoke")}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h3>{tt("boardMenu.industry")}</h3>
          <Gate id="CORE-03">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BOARD_TEMPLATES.map((bt) => (
                <button
                  key={bt.name}
                  className="ghost"
                  title={bt.columns.map((c) => c[0]).join(" → ")}
                  onClick={() => {
                    if (!window.confirm(tt("boardMenu.replaceConfirm", { name: bt.name }))) return;
                    applyBoardTemplate(projectId, bt.columns);
                    toast(tt("boardMenu.applied", { name: bt.name }));
                    onClose();
                  }}
                >
                  {bt.name}
                </button>
              ))}
            </div>
          </Gate>
        </section>
      </div>
    </Modal>
  );
}
