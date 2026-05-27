import React, { useState } from "react";
import { X, Calendar, Paperclip, UserPlus } from "lucide-react";
import "./tasks.css";

const PRIORITIES = [
  { id: "low", label: "Low", color: "#28a745" },
  { id: "medium", label: "Medium", color: "#ffc107" },
  { id: "high", label: "High", color: "#dc3545" },
];

export default function AddTaskModal({ open, onClose, onSave }) {
  const [taskName, setTaskName] = useState("");
  const [checklist, setChecklist] = useState("All");
  const [priority, setPriority] = useState("low");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  const canSave = taskName.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave?.({
      taskName: taskName.trim(),
      checklist,
      priority,
      dueDate,
      tags,
      description,
    });
    setTaskName("");
    setDescription("");
    onClose();
  };

  return (
    <div className="tasks-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="tasks-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="add-task-title"
      >
        <div className="tasks-modal__header">
          <h2 id="add-task-title" className="tasks-modal__title">
            Add Task
          </h2>
          <button
            type="button"
            className="tasks-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="tasks-modal__body">
          <div className="tasks-form-row">
            <label className="tasks-form-label">
              Task Name <span className="tasks-required">*</span>
            </label>
            <input
              type="text"
              className="tasks-form-input"
              placeholder="e.g. Collect documents"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </div>

          <div className="tasks-form-row">
            <label className="tasks-form-label">Assignee</label>
            <button type="button" className="tasks-link-btn">
              <UserPlus size={18} />
              Add Assignee
            </button>
          </div>

          <div className="tasks-form-row">
            <label className="tasks-form-label">Checklist</label>
            <select
              className="tasks-form-input"
              value={checklist}
              onChange={(e) => setChecklist(e.target.value)}
            >
              <option>All</option>
              <option>Onboarding</option>
              <option>Offboarding</option>
            </select>
          </div>

          <div className="tasks-form-row">
            <label className="tasks-form-label">Priority</label>
            <div className="tasks-priority-group">
              {PRIORITIES.map((p) => (
                <label key={p.id} className="tasks-priority-option">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === p.id}
                    onChange={() => setPriority(p.id)}
                  />
                  <span
                    className="tasks-priority-dot"
                    style={{
                      borderColor: p.color,
                      background:
                        priority === p.id ? p.color : "transparent",
                    }}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <div className="tasks-form-row">
            <label className="tasks-form-label">Due Date</label>
            <div className="tasks-form-input-wrap">
              <input
                type="text"
                className="tasks-form-input"
                placeholder="Enter Date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <Calendar size={16} className="tasks-form-input-icon" />
            </div>
          </div>

          <div className="tasks-form-row">
            <label className="tasks-form-label">Tags</label>
            <input
              type="text"
              className="tasks-form-input"
              placeholder="Search"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="tasks-form-row">
            <label className="tasks-form-label">Followers</label>
            <button type="button" className="tasks-link-btn">
              <UserPlus size={18} />
              Add followers
            </button>
          </div>

          <div className="tasks-form-row tasks-form-row--top">
            <label className="tasks-form-label">Description</label>
            <textarea
              className="tasks-form-textarea"
              placeholder="Write a description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="tasks-form-row">
            <span className="tasks-form-label" />
            <button type="button" className="tasks-attach-btn">
              <Paperclip size={16} />
              Attach
            </button>
          </div>
        </div>

        <div className="tasks-modal__footer">
          <button type="button" className="tasks-btn-text" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`tasks-btn-save ${canSave ? "tasks-btn-save--enabled" : ""}`}
            disabled={!canSave}
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
