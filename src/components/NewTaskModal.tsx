"use client";
import { FormEvent, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PRIORITY_LABEL, TODAY, offsetForDate } from "@/lib/mock-data";
import { MemberId, Priority, Status } from "@/types";
import Modal from "./Modal";
import Dropdown from "./Dropdown";

function defaultDueDate() {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function NewTaskModal() {
  const { newTaskDefaults, closeNewTaskModal, addTask, toast, members, getColumns } = useStore();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("m");
  const [assignee, setAssignee] = useState<MemberId>("me");
  const [status, setStatus] = useState<Status>("todo");
  const [due, setDue] = useState(defaultDueDate());

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
    }
  }, [newTaskDefaults]);

  if (!newTaskDefaults) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = title.trim();
    if (!v) return toast("Enter a task title first");
    addTask({ projectId: newTaskDefaults!.projectId, status, title: v, priority, assignee, dueOffset: offsetForDate(due) });
    const label = getColumns(newTaskDefaults!.projectId).find((c) => c[0] === status)?.[1] ?? status;
    toast("Task added to " + label);
    setTitle("");
    closeNewTaskModal();
  }

  return (
    <Modal title="New task" onClose={closeNewTaskModal}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>
          Title
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" />
        </label>
        <div className="f2">
          <label>
            Status
            <Dropdown
              value={status}
              onChange={setStatus}
              options={getColumns(newTaskDefaults.projectId).map(([s, label]) => ({ value: s, label }))}
            />
          </label>
          <label>
            Priority
            <Dropdown
              value={priority}
              onChange={setPriority}
              options={(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => ({ value: k, label: PRIORITY_LABEL[k] }))}
            />
          </label>
          <label>
            Assignee
            <Dropdown
              value={assignee}
              onChange={setAssignee}
              options={(Object.keys(members) as MemberId[]).map((k) => ({ value: k, label: members[k].name }))}
            />
          </label>
          <label>
            Due date
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
        <button className="btn">Create task</button>
      </form>
    </Modal>
  );
}
