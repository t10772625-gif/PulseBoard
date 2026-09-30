"use client";
import { FormEvent, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PRIORITY_LABEL, TODAY, offsetForDate } from "@/lib/mock-data";
import { autoPriority, findDuplicates, smartMatch } from "@/lib/ai";
import { MemberId, Priority, Status } from "@/types";
import Modal from "./Modal";
import Dropdown from "./Dropdown";

function defaultDueDate() {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function NewTaskModal() {
  const { newTaskDefaults, closeNewTaskModal, createTask, addAttachments, toast, members, getColumns, tasks, history, capacity, can, openDrawer, projects } = useStore();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("m");
  const [assignee, setAssignee] = useState<MemberId>("me");
  const [status, setStatus] = useState<Status>("todo");
  const [due, setDue] = useState(defaultDueDate());
  const [bug, setBug] = useState(false);
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [shots, setShots] = useState<File[]>([]);

  // newTaskDefaults changes every time the modal is (re)opened, from any column/button —
  // reset the form to a blank state pre-filled with that column's status each time.
  useEffect(() => {
    if (newTaskDefaults) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the form fresh every time it's (re)opened, from any column
      setStatus(newTaskDefaults.status);
      setTitle("");
      setPriority("m");
      setAssignee("me");
      setDue(defaultDueDate());
      setBug(false);
      setSteps("");
      setExpected("");
      setActual("");
      setShots([]);
    }
  }, [newTaskDefaults]);

  if (!newTaskDefaults) return null;
  const projectId = newTaskDefaults.projectId;
  const clean = title.trim();
  const dups = can("AI-03") && clean.length > 5 ? findDuplicates(clean, tasks.filter((t) => t.projectId === projectId), undefined, 0.4) : [];
  const ap = can("AI-04") && clean.length > 3 ? autoPriority({ title: clean, labels: bug ? ["Bug"] : [], dueOffset: offsetForDate(due), reports: dups.length }) : null;
  const match = can("AI-01") && clean.length > 3 ? smartMatch({ id: "", title: clean, description: "", labels: bug ? ["Bug"] : [] }, tasks, history, members, capacity).results[0] : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!clean) return toast("Enter a task title first");
    const description = bug ? `Steps to reproduce:\n${steps || "-"}\n\nExpected:\n${expected || "-"}\n\nActual:\n${actual || "-"}` : "";
    const id = createTask({ projectId, status, title: clean, priority, assignee, dueOffset: offsetForDate(due), labels: bug ? ["Bug"] : ["New"], description, module: ap?.module });
    if (shots.length) addAttachments(id, shots);
    const label = getColumns(projectId).find((c) => c[0] === status)?.[1] ?? status;
    toast("Task added to " + label);
    closeNewTaskModal();
  }

  return (
    <Modal title={bug ? `Report a bug · ${projects[projectId]?.name}` : `New task · ${projects[projectId]?.name}`} onClose={closeNewTaskModal}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <div className="tabs" style={{ justifySelf: "start" }}>
          <button type="button" className={!bug ? "on" : ""} onClick={() => setBug(false)}>
            Task
          </button>
          <button type="button" className={bug ? "on" : ""} onClick={() => setBug(true)}>
            🐞 Bug report
          </button>
        </div>
        <label>
          Title
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={bug ? "What's broken?" : "What needs to be done?"} />
        </label>
        {dups.length > 0 && (
          <div className="warn" style={{ textAlign: "left" }}>
            Possible duplicate:{" "}
            <button
              type="button"
              className="link"
              onClick={() => {
                closeNewTaskModal();
                openDrawer(dups[0].task.id);
              }}
            >
              {dups[0].task.title}
            </button>{" "}
            ({Math.round(dups[0].score * 100)}% similar)
          </div>
        )}
        {bug && (
          <>
            <label>
              Steps to reproduce
              <textarea rows={3} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={"1. Open …\n2. Tap …"} />
            </label>
            <div className="f2">
              <label>
                Expected
                <input value={expected} onChange={(e) => setExpected(e.target.value)} />
              </label>
              <label>
                Actual
                <input value={actual} onChange={(e) => setActual(e.target.value)} />
              </label>
            </div>
            <label>
              Screenshots
              <input type="file" accept="image/*" multiple capture="environment" onChange={(e) => setShots(Array.from(e.target.files ?? []))} />
            </label>
            <p className="mute" style={{ fontSize: 12 }}>
              Structured bug report. Reading the screenshot automatically needs a vision AI model (paid API), which isn&apos;t connected.
            </p>
          </>
        )}
        <div className="f2">
          <label>
            Status
            <Dropdown value={status} onChange={setStatus} options={getColumns(projectId).map(([s, label]) => ({ value: s, label }))} />
          </label>
          <label>
            Priority
            <Dropdown value={priority} onChange={setPriority} options={(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => ({ value: k, label: PRIORITY_LABEL[k] }))} />
          </label>
          <label>
            Assignee
            <Dropdown value={assignee} onChange={setAssignee} options={(Object.keys(members) as MemberId[]).map((k) => ({ value: k, label: members[k].name }))} />
          </label>
          <label>
            Due date
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
        {(ap || match) && (
          <div className="pill-row" style={{ fontSize: 12 }}>
            {ap && ap.priority !== priority && (
              <button type="button" className="chip" onClick={() => setPriority(ap.priority)} title={ap.reasons.join(" · ")}>
                ✨ Suggest {PRIORITY_LABEL[ap.priority]} priority
              </button>
            )}
            {match && match.member !== assignee && (
              <button type="button" className="chip" onClick={() => setAssignee(match.member)} title={match.reason}>
                ✨ Assign {members[match.member].name} ({match.reason})
              </button>
            )}
          </div>
        )}
        <button className="btn">{bug ? "Submit bug" : "Create task"}</button>
      </form>
    </Modal>
  );
}
