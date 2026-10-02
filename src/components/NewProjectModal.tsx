"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PROJECT_COLOR_PRESETS } from "@/lib/mock-data";
import { PLANS } from "@/lib/plans";
import Modal from "./Modal";
import FieldError, { invalid } from "./FieldError";
import { v, type FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

export default function NewProjectModal() {
  const { newProjectOpen, closeNewProjectModal, addProject, toast, projects, plan } = useStore();
  const router = useRouter();
  const { t: tt } = useT();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preset, setPreset] = useState(0);
  const [errors, setErrors] = useState<Record<string, FieldMsg>>({});

  if (!newProjectOpen) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = { name: v.text(name, 2, 80), description: v.maxLen(description, 300) };
    setErrors(found);
    if (found.name || found.description) return;
    const clean = name.trim();
    // Plan limit: Basic allows 1 project
    if (Object.keys(projects).length >= PLANS[plan].boards) return toast(tt("newProject.limit", { plan: tt(`plan.${plan}`), n: PLANS[plan].boards }));
    const { color, gradient } = PROJECT_COLOR_PRESETS[preset];
    const id = addProject(clean, description.trim(), color, gradient);
    toast(tt("newProject.created"));
    setName("");
    setDescription("");
    closeNewProjectModal();
    router.push(`/projects/${id}`);
  }

  return (
    <Modal title={tt("newProject.title")} onClose={closeNewProjectModal}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }} noValidate>
        <label>
          {tt("newProject.name")}
          <input autoFocus value={name} maxLength={80} onChange={(e) => (setName(e.target.value), setErrors((x) => ({ ...x, name: null })))} placeholder={tt("newProject.namePlaceholder")} {...invalid("err-pn", errors.name)} />
          <FieldError id="err-pn" msg={errors.name} />
        </label>
        <label>
          {tt("newProject.description")}
          <input value={description} maxLength={300} onChange={(e) => (setDescription(e.target.value), setErrors((x) => ({ ...x, description: null })))} placeholder={tt("newProject.descPlaceholder")} {...invalid("err-pd", errors.description)} />
          <FieldError id="err-pd" msg={errors.description} />
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
