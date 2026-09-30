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
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { PERMISSIONS, pagePermissionFor } from "@/lib/permissions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loggedIn, login, logout, openTaskId, closeDrawer, allowed, viewAsRole, workspaceStatus, retryWorkspace } = useStore();
  const router = useRouter();
  const pathname = usePathname();
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
    // Keep a real Supabase session across page reloads
    supabase.auth.getSession().then(({ data }) => (data.session ? login() : router.replace("/login")));
  }, [loggedIn, router, login]);

  if (!loggedIn) return null;

  // Real mode: nothing renders until the workspace is loaded from the database,
  // so sample data can never be mistaken for the user's own.
  if (workspaceStatus !== "ready") {
    return (
      <div className="ws-state">
        {workspaceStatus === "loading" ? (
          <p className="mute" role="status">
            Loading your workspace…
          </p>
        ) : (
          <div className="card" role="alert">
            <h2>Couldn&apos;t load your workspace</h2>
            <p className="mute">Check your connection and try again. If it keeps failing, the database may be missing a migration.</p>
            <div className="pill-row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={retryWorkspace}>
                Retry
              </button>
              <button
                className="ghost"
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
              >
                Log out
              </button>
            </div>
          </div>
        )}
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
                <h2>No access</h2>
                <p className="mute">
                  The {viewAsRole} role can&apos;t open {PERMISSIONS.find((p) => p.key === pagePerm)?.label ?? "this page"}. Ask your workspace admin if you need it.
                </p>
                <Link className="btn" href="/dashboard" style={{ marginTop: 12 }}>
                  Go to Home
                </Link>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
      <div className={`ov ${openTaskId ? "on" : ""}`} onClick={closeDrawer}></div>
      <div className={`dr ${openTaskId ? "on" : ""}`} role="dialog" aria-modal="true" aria-label="Task details">
        {openTaskId && <TaskDrawer taskId={openTaskId} />}
      </div>
      <CommandPalette />
      <GlobalFeatures />
      <NewTaskModal />
      <NewProjectModal />
      <AddColumnModal />
      <InviteModal />
      <Toast />
    </>
  );
}
