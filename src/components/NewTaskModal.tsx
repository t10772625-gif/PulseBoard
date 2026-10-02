"use client";
import { FormEvent, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PRIORITY_LABEL, TODAY, offsetForDate } from "@/lib/mock-data";
import { autoPriority, findDuplicates, smartMatch } from "@/lib/ai";
import { MemberId, Priority, Status } from "@/types";
import Modal from "./Modal";
import Dropdown from "./Dropdown";
import FieldError, { invalid } from "./FieldError";
import { v, type FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

function defaultDueDate() {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function NewTaskModal() {
  const { newTaskDefaults, closeNewTaskModal, createTask, addAttachments, toast, members, getColumns, columnLabel, tasks, history, capacity, can, openDrawer, projects } = useStore();
  const { t: tt } = useT();
  const [title, setTitle] = useState("");
  const [titleErr, setTitleErr] = useState<FieldMsg>(null);
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
    const problem = v.text(title, 2, 300);
    setTitleErr(problem);
    if (problem) return;
    const description = bug ? tt("newTask.bugTemplate", { steps: steps || "-", expected: expected || "-", actual: actual || "-" }) : "";
    const id = createTask({ projectId, status, title: clean, priority, assignee, dueOffset: offsetForDate(due), labels: bug ? ["Bug"] : ["New"], description, module: ap?.module });
    if (shots.length) addAttachments(id, shots);
    toast(tt("newTask.addedTo", { column: columnLabel(projectId, status) }));
    closeNewTaskModal();
  }

  return (
    <Modal title={bug ? tt("newTask.titleBug", { project: projects[projectId]?.name ?? "" }) : tt("newTask.titleTask", { project: projects[projectId]?.name ?? "" })} onClose={closeNewTaskModal}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }} noValidate>
        <div className="tabs" style={{ justifySelf: "start" }}>
          <button type="button" className={!bug ? "on" : ""} onClick={() => setBug(false)}>
            {tt("newTask.tabTask")}
          </button>
          <button type="button" className={bug ? "on" : ""} onClick={() => setBug(true)}>
            {tt("newTask.tabBug")}
          </button>
        </div>
        <label>
          {tt("newTask.title")}
          <input autoFocus value={title} maxLength={300} onChange={(e) => (setTitle(e.target.value), setTitleErr(null))} placeholder={bug ? tt("newTask.bugPlaceholder") : tt("newTask.taskPlaceholder")} {...invalid("err-tt", titleErr)} />
          <FieldError id="err-tt" msg={titleErr} />
        </label>
        {dups.length > 0 && (
          <div className="warn" style={{ textAlign: "start" }}>
            {tt("newTask.possibleDup")}{" "}
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
            {tt("newTask.similar", { pct: Math.round(dups[0].score * 100) })}
          </div>
        )}
        {bug && (
          <>
            <label>
              {tt("newTask.steps")}
              <textarea rows={3} value={steps} maxLength={3000} onChange={(e) => setSteps(e.target.value)} placeholder={tt("newTask.stepsPlaceholder")} />
            </label>
            <div className="f2">
              <label>
                {tt("newTask.expected")}
                <input value={expected} maxLength={500} onChange={(e) => setExpected(e.target.value)} placeholder={tt("newTask.expectedPlaceholder")} />
              </label>
              <label>
                {tt("newTask.actual")}
                <input value={actual} maxLength={500} onChange={(e) => setActual(e.target.value)} placeholder={tt("newTask.actualPlaceholder")} />
              </label>
            </div>
            <label>
              {tt("newTask.screenshots")}
              <input type="file" accept="image/*" multiple capture="environment" onChange={(e) => setShots(Array.from(e.target.files ?? []))} />
            </label>
            <p className="mute" style={{ fontSize: 12 }}>
              {tt("newTask.visionNote")}
            </p>
          </>
        )}
        <div className="f2">
          <label>
            {tt("common.status")}
            <Dropdown value={status} onChange={setStatus} options={getColumns(projectId).map(([s]) => ({ value: s, label: columnLabel(projectId, s) }))} />
          </label>
          <label>
            {tt("common.priority")}
            <Dropdown value={priority} onChange={setPriority} options={(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => ({ value: k, label: PRIORITY_LABEL[k] }))} />
          </label>
          <label>
            {tt("common.assignee")}
            <Dropdown value={assignee} onChange={setAssignee} options={(Object.keys(members) as MemberId[]).map((k) => ({ value: k, label: members[k].name }))} />
          </label>
          <label>
            {tt("common.dueDate")}
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
        {(ap || match) && (
          <div className="pill-row" style={{ fontSize: 12 }}>
            {ap && ap.priority !== priority && (
              <button type="button" className="chip" onClick={() => setPriority(ap.priority)} title={ap.reasons.join(" · ")}>
                {tt("newTask.suggestPriority", { priority: PRIORITY_LABEL[ap.priority] })}
              </button>
            )}
            {match && match.member !== assignee && (
              <button type="button" className="chip" onClick={() => setAssignee(match.member)} title={match.reason}>
                {tt("newTask.suggestAssign", { name: members[match.member].name, reason: match.reason })}
              </button>
            )}
          </div>
        )}
        <button className="btn">{bug ? tt("newTask.submitBug") : tt("newTask.create")}</button>
      </form>
    </Modal>
  );
}
