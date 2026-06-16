import React, { useState } from "react";
import { X } from "lucide-react";
import { DEPARTMENTS } from "../../data/teamsData";

export default function CreateTeamModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !department) return;

    onCreate({
      name: name.trim(),
      department,
      description: description.trim(),
    });

    setName("");
    setDepartment("");
    setDescription("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setDepartment("");
    setDescription("");
    onClose();
  };

  return (
    <div className="teams-modal-backdrop" onClick={handleClose}>
      <div
        className="teams-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-team-title"
      >
        <div className="teams-modal__header">
          <div>
            <h2 id="create-team-title" className="teams-modal__title">
              Create New Team
            </h2>
            <p className="teams-modal__subtitle">
              Add a new team to your organization.
            </p>
          </div>
          <button
            type="button"
            className="teams-modal__close"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="teams-modal__form">
          <div className="teams-modal__field">
            <label htmlFor="team-name">
              Team Name <span className="teams-modal__required">*</span>
            </label>
            <input
              id="team-name"
              type="text"
              placeholder="e.g. Mobile Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="teams-modal__field">
            <label htmlFor="team-department">
              Department <span className="teams-modal__required">*</span>
            </label>
            <select
              id="team-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="teams-modal__field">
            <label htmlFor="team-description">Description</label>
            <textarea
              id="team-description"
              placeholder="What does this team do?"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="teams-modal__footer">
            <button
              type="button"
              className="teams-modal__btn teams-modal__btn--cancel"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="teams-modal__btn teams-modal__btn--create"
              disabled={!name.trim() || !department}
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
