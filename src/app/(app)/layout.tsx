"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import TaskDrawer from "@/components/TaskDrawer";
import CommandPalette from "@/components/CommandPalette";
import GlobalFeatures from "@/components/GlobalFeatures";
import Toast from "@/components/Toast";
import NewTaskModal from "@/components/NewTaskModal";
import NewProjectModal from "@/components/NewProjectModal";
import AddColumnModal from "@/components/AddColumnModal";
import InviteModal from "@/components/InviteModal";
import NoBoardsPrompt from "@/components/NoBoardsPrompt";
import WorkspaceLoader from "@/components/WorkspaceLoader";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { pagePermissionFor } from "@/lib/permissions";
import { pendingMfaFactor } from "@/components/AuthForm";
import { useT } from "@/i18n/I18nProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loggedIn, login, logout, openTaskId, closeDrawer, allowed, viewAsRole, workspaceStatus, retryWorkspace, deactivated, setAccountActive } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();
  // Page-level RBAC: a role without the page permission sees this instead of the page
  const pagePerm = pagePermissionFor(pathname);
  const blocked = pagePerm !== null && !allowed(pagePerm);

  useEffect(() => {
    if (loggedIn) return;
    const supabase = getSupabase();
    if (!supabase) {
      router.replace("/login");
      return;
    }
    // Keep a real Supabase session across page reloads. A session that still needs its
    // two-factor code goes back to the sign-in page for that step (the database also
    // refuses workspace data to it, see 23_account-security …2310).
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return router.replace("/login");
      if (await pendingMfaFactor()) return router.replace("/login");
      login();
    });
  }, [loggedIn, router, login]);

  // Session check (before sign-in is confirmed) shows the same loader, not a blank page
  if (!loggedIn) return <WorkspaceLoader />;

  // Real mode: nothing renders until the workspace is loaded from the database,
  // so sample data can never be mistaken for the user's own.
  if (workspaceStatus !== "ready") {
    return (
      <div className="ws-state">
        {workspaceStatus === "loading" ? (
          <WorkspaceLoader />
        ) : (
          <div className="card" role="alert">
            <h2>{t("layout.loadFailedTitle")}</h2>
            <p className="mute">{t("layout.loadFailedBody")}</p>
            <div className="pill-row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={retryWorkspace}>
                {t("common.retry")}
              </button>
              <button
                className="ghost"
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
              >
                {t("common.logOut")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // A deactivated account sees only this choice (set_my_account_active, 23_account-security)
  if (deactivated) {
    return (
      <div className="ws-state">
        <div className="card" role="alert">
          <h2>{t("layout.deactivatedTitle")}</h2>
          <p className="mute">{t("layout.deactivatedBody")}</p>
          <div className="pill-row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => void setAccountActive(true)}>
              {t("layout.reactivate")}
            </button>
            <button
              className="ghost"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              {t("common.logOut")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Topbar />
          <div className="page">
            {blocked ? (
              <div className="card no-access">
                <h2>{t("layout.noAccessTitle")}</h2>
                <p className="mute">
                  {t("layout.noAccessBody", { role: t(`role.${viewAsRole}`), page: pagePerm ? t(`perm.${pagePerm}`) : t("layout.thisPage") })}
                </p>
                <Link className="btn" href="/dashboard" style={{ marginTop: 12 }}>
                  {t("layout.goHome")}
                </Link>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
      <div className={`ov ${openTaskId ? "on" : ""}`} onClick={closeDrawer}></div>
      <div className={`dr ${openTaskId ? "on" : ""}`} role="dialog" aria-modal="true" aria-label={t("layout.taskDetails")}>
        {openTaskId && <TaskDrawer taskId={openTaskId} />}
      </div>
      <CommandPalette />
      <GlobalFeatures />
      <NewTaskModal />
      <NewProjectModal />
      <AddColumnModal />
      <InviteModal />
      <NoBoardsPrompt />
      <Toast />
    </>
  );
}
