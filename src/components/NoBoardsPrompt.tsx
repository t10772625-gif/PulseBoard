"use client";
import { useState } from "react";
import { LayoutDashboard, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";
import Modal from "./Modal";

// One shared "no boards yet" popup for the whole app, instead of a create-board
// button on every page. It shows once the workspace has loaded with zero boards;
// Close hides it for this browser session (the person may only be looking around).
// The dismissal is a convenience stored per workspace and grants nothing.
const KEY = "pb.noBoardsDismissed";

function wasDismissed(ws: string): boolean {
  try {
    return sessionStorage.getItem(KEY) === ws;
  } catch {
    return false;
  }
}

export default function NoBoardsPrompt() {
  const { projects, workspaceStatus, workspaceId, newProjectOpen, openNewProjectModal, allowed } = useStore();
  const { t } = useT();
  const ws = workspaceId || "demo";
  const [closedFor, setClosedFor] = useState<string | null>(null);
  const empty = workspaceStatus === "ready" && Object.keys(projects).length === 0;
  if (!empty || newProjectOpen || closedFor === ws || wasDismissed(ws)) return null;

  const close = () => {
    try {
      sessionStorage.setItem(KEY, ws);
    } catch {
      /* private mode: closing still works for this page view */
    }
    setClosedFor(ws);
  };
  const canCreate = allowed("project.manage");

  return (
    <Modal title={t("noBoards.title")} onClose={close}>
      <div className="nb-body">
        <span className="nb-icon" aria-hidden>
          <LayoutDashboard size={28} />
        </span>
        <p>{canCreate ? t("noBoards.body") : t("noBoards.bodyMember")}</p>
        <ul className="nb-list">
          <li>{t("noBoards.point1")}</li>
          <li>{t("noBoards.point2")}</li>
          <li>{t("noBoards.point3")}</li>
        </ul>
        <div className="nb-actions">
          <button className="ghost" onClick={close}>
            {t("noBoards.later")}
          </button>
          {canCreate && (
            <button
              className="btn"
              onClick={() => {
                close();
                openNewProjectModal();
              }}
            >
              <Plus size={16} aria-hidden /> {t("noBoards.create")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
