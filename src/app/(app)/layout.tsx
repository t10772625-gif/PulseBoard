"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import TaskDrawer from "@/components/TaskDrawer";
import CommandPalette from "@/components/CommandPalette";
import Toast from "@/components/Toast";
import NewTaskModal from "@/components/NewTaskModal";
import NewProjectModal from "@/components/NewProjectModal";
import AddColumnModal from "@/components/AddColumnModal";
import InviteModal from "@/components/InviteModal";
import { useStore } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loggedIn, openTaskId, closeDrawer } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!loggedIn) router.replace("/login");
  }, [loggedIn, router]);

  if (!loggedIn) return null;

  return (
    <>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Topbar />
          <div className="page">{children}</div>
        </main>
      </div>
      <div className={`ov ${openTaskId ? "on" : ""}`} onClick={closeDrawer}></div>
      <div className={`dr ${openTaskId ? "on" : ""}`} role="dialog" aria-modal="true" aria-label="Task details">
        {openTaskId && <TaskDrawer taskId={openTaskId} />}
      </div>
      <CommandPalette />
      <NewTaskModal />
      <NewProjectModal />
      <AddColumnModal />
      <InviteModal />
      <Toast />
    </>
  );
}
