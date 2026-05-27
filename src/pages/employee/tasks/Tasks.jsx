import React, { useState } from "react";
import AddTaskModal from "./AddTaskModal";
import TasksEmptyIllustration from "./TasksEmptyIllustration";
import "./tasks.css";

export default function Tasks() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);

  const handleSave = (task) => {
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), ...task },
    ]);
  };

  return (
    <div className="tasks-page">
      {tasks.length === 0 ? (
        <div className="tasks-empty">
          <TasksEmptyIllustration />
          <p className="tasks-empty__text">
            You haven&apos;t added any tasks yet! Start by creating new tasks
            or configuring checklists.
          </p>
          <button
            type="button"
            className="tasks-btn-add"
            onClick={() => setModalOpen(true)}
          >
            Add new task
          </button>
        </div>
      ) : (
        <div className="tasks-list w-full">
          <div className="flex justify-between items-center mb-4 px-2">
            <h1 className="text-lg font-bold text-[#333]">Tasks</h1>
            <button
              type="button"
              className="tasks-btn-add"
              onClick={() => setModalOpen(true)}
            >
              Add new task
            </button>
          </div>
          {tasks.map((task) => (
            <div key={task.id} className="tasks-list-item">
              <strong>{task.taskName}</strong>
              <span className="text-[#888] ml-2">· {task.priority}</span>
            </div>
          ))}
        </div>
      )}

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
