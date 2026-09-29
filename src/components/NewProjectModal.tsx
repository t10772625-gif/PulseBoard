"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PROJECT_COLOR_PRESETS } from "@/lib/mock-data";
import Modal from "./Modal";

export default function NewProjectModal() {
  const { newProjectOpen, closeNewProjectModal, addProject, toast } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preset, setPreset] = useState(0);

  if (!newProjectOpen) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return toast("Enter a project name first");
    const { color, gradient } = PROJECT_COLOR_PRESETS[preset];
    const id = addProject(v, description.trim(), color, gradient);
    toast("Project created");
    setName("");
    setDescription("");
    closeNewProjectModal();
    router.push(`/projects/${id}`);
  }

  return (
    <Modal title="New project" onClose={closeNewProjectModal}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>
          Project name
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marketing site" />
        </label>
        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" />
        </label>
        <label>
          Color
          <div className="swatches">
            {PROJECT_COLOR_PRESETS.map((p, i) => (
              <button
                type="button"
                key={i}
                className={`swatch ${i === preset ? "sel" : ""}`}
                style={{ background: `linear-gradient(135deg, ${p.color}, ${p.gradient})` }}
                aria-label={`Color option ${i + 1}`}
                onClick={() => setPreset(i)}
              />
            ))}
          </div>
        </label>
        <button className="btn">Create project</button>
      </form>
    </Modal>
  );
}
