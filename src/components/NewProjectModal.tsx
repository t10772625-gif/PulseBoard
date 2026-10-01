"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PROJECT_COLOR_PRESETS } from "@/lib/mock-data";
import { PLANS } from "@/lib/plans";
import Modal from "./Modal";
import { useT } from "@/i18n/I18nProvider";

export default function NewProjectModal() {
  const { newProjectOpen, closeNewProjectModal, addProject, toast, projects, plan } = useStore();
  const router = useRouter();
  const { t: tt } = useT();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preset, setPreset] = useState(0);

  if (!newProjectOpen) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return toast(tt("newProject.enterName"));
    // Plan limit: Free allows 1 project
    if (Object.keys(projects).length >= PLANS[plan].boards) return toast(tt("newProject.limit", { plan: tt(`plan.${plan}`), n: PLANS[plan].boards }));
    const { color, gradient } = PROJECT_COLOR_PRESETS[preset];
    const id = addProject(v, description.trim(), color, gradient);
    toast(tt("newProject.created"));
    setName("");
    setDescription("");
    closeNewProjectModal();
    router.push(`/projects/${id}`);
  }

  return (
    <Modal title={tt("newProject.title")} onClose={closeNewProjectModal}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>
          {tt("newProject.name")}
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={tt("newProject.namePlaceholder")} />
        </label>
        <label>
          {tt("newProject.description")}
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={tt("newProject.descPlaceholder")} />
        </label>
        <label>
          {tt("newProject.color")}
          <div className="swatches">
            {PROJECT_COLOR_PRESETS.map((p, i) => (
              <button
                type="button"
                key={i}
                className={`swatch ${i === preset ? "sel" : ""}`}
                style={{ background: `linear-gradient(135deg, ${p.color}, ${p.gradient})` }}
                aria-label={tt("newProject.colorOption", { n: i + 1 })}
                onClick={() => setPreset(i)}
              />
            ))}
          </div>
        </label>
        <button className="btn">{tt("newProject.create")}</button>
      </form>
    </Modal>
  );
}
