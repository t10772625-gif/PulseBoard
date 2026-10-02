"use client";
import { useStore } from "@/lib/store";
import { AUTOMATION_GROUP, AUTOMATION_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useT } from "@/i18n/I18nProvider";

// CORE-11 recurring tasks (set the repeat in a task's drawer)
export default function AutomationRecurring() {
  const { tasks, openDrawer } = useStore();
  const { t: tt } = useT();
  const recurring = tasks.filter((t) => t.recurrence && t.recurrence !== "none");
  return (
    <>
      <SubPageHeader group={AUTOMATION_GROUP} page={AUTOMATION_PAGES[4]} hint={tt("auto.hint")} />
      <div className="grid g2">
        <div className="card">
          <h2>{tt("auto.recurring")}</h2>
          <Gate id="CORE-11">
            {recurring.length ? (
              recurring.map((t) => (
                <button key={t.id} className="row" onClick={() => openDrawer(t.id)}>
                  <span>{t.title}</span>
                  <span className="chip">🔁 {t.recurrence ? tt(`drawer.${t.recurrence === "none" ? "never" : t.recurrence}`) : ""}</span>
                </button>
              ))
            ) : (
              <p className="mute">{tt("auto.noRecurring")}</p>
            )}
          </Gate>
        </div>
      </div>
    </>
  );
}
