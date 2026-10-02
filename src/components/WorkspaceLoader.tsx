"use client";
import { useEffect, useState } from "react";
import { HeroEcg } from "./ui";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

// Full-screen loader while the session is checked and the workspace is fetched.
// The step text cycles through what loadWorkspace() actually reads (members,
// boards, tasks, settings); it is an indication of activity, not real progress.
const STEPS: MessageKey[] = ["loader.step1", "loader.step2", "loader.step3", "loader.step4"];

export default function WorkspaceLoader() {
  const { t } = useT();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="wl-screen" role="status" aria-live="polite" aria-label={t("layout.loadingWorkspace")}>
      <div className="wl-glow" aria-hidden />
      <div className="wl-center">
        <div className="wl-logo" aria-hidden>
          <span className="wl-ring" />
          <span className="wl-ring r2" />
          <span className="wl-ring r3" />
          <b />
        </div>
        <p className="wl-brand">PulseBoard</p>
        <div className="wl-ecg" aria-hidden>
          <HeroEcg />
        </div>
        <h1 className="wl-title">{t("layout.loadingWorkspace")}</h1>
        <p className="wl-step" key={step}>
          {t(STEPS[step])}
        </p>
        <div className="wl-bar" aria-hidden>
          <i />
        </div>
      </div>
    </div>
  );
}
