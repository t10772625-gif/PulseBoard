"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";
import { ProjectId } from "@/types";
import Dropdown from "./Dropdown";

// "Board:" picker for sub-pages that create tasks: which board new tasks go into.
// It starts on the current board. A workspace with no boards gets a "Create a board"
// button instead of an empty list, and `ready` is false so pages disable their
// create buttons (a task can't exist without a board).
export function useProjectPicker() {
  const { projects, currentProjectId, openNewProjectModal, allowed } = useStore();
  const { t } = useT();
  const [picked, setProject] = useState<ProjectId>(currentProjectId);
  const ids = Object.keys(projects);
  const project = projects[picked] ? picked : ids[0] ?? "";
  const ready = !!project;
  const picker = ready ? (
    <label className="pp-picker">
      <span className="mute">{t("picker.board")}</span>
      <Dropdown value={project} onChange={setProject} options={ids.map((p) => ({ value: p, label: projects[p].name }))} />
    </label>
  ) : (
    <div className="pp-picker">
      <span className="mute">{t("picker.noBoards")}</span>
      {allowed("project.manage") && (
        <button className="ghost sm" onClick={openNewProjectModal}>
          {t("picker.createBoard")}
        </button>
      )}
    </div>
  );
  return { project, picker, ready };
}
