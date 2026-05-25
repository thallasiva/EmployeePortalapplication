import React, { useState } from "react";
import ChangeAssignmentModal from "../../component/profile/ChangeAssignmentModal";
import { avatarDataUri, PLACEHOLDER_AVATAR_LG } from "../../lib/placeholders";

export default function EmployeeProfile() {
  const [activeModal, setActiveModal] = useState(null);
  const [managerName, setManagerName] = useState("Richard Wilson");
  const [officeName, setOfficeName] = useState("Head Office");
  const [teamName, setTeamName] = useState("PHP");

  const managerOptions = ["Richard Wilson", "Maria Cotton", "John Gibbs"];
  const teamOptions = ["PHP", "React", "Design", "QA Team"];

  const openModal = (type) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);
  const handleSubmit = () => closeModal();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white shadow">
          <div className="border-b p-4 font-semibold">
            Add Maria Cotton to Another Team
          </div>

          <div className="space-y-4 p-4">
            <select className="w-full rounded-md border px-3 py-3 text-sm text-gray-500">
              <option>Select Team</option>
            </select>

            <button className="rounded-md bg-brand px-6 py-2 font-semibold text-white">
              New Team
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow">
          <div className="flex justify-between border-b p-4">
            <span className="font-semibold">{teamName} Team</span>

            <div className="space-x-2">
              <button
                type="button"
                onClick={() => openModal("team")}
                className="rounded border px-3 py-1"
              >
                Edit
              </button>
              <button className="rounded border px-3 py-1 text-red-500">
                Delete
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4">
            <img
              src={PLACEHOLDER_AVATAR_LG}
              className="h-10 w-10 rounded-full"
              alt=""
            />
            <span className="font-semibold">Maria Cotton</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-white shadow">
        <div className="flex justify-between border-b p-4">
          <div>
            <div className="font-semibold">Focus Technologies</div>
            <div className="text-xs text-gray-500">{officeName}</div>
          </div>

          <button
            type="button"
            onClick={() => openModal("office")}
            className="rounded-md bg-indigo-600 px-5 py-2 text-white"
          >
            Change Office
          </button>
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Members</span>

            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <img
                  key={i}
                  src={avatarDataUri(i + 10)}
                  className="h-10 w-10 rounded-full border-2 border-white"
                  alt=""
                />
              ))}
            </div>
          </div>

          <button className="rounded-md bg-brand px-5 py-2 text-white">
            Visit Office
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white shadow">
          <div className="flex justify-between border-b p-4">
            <span className="font-semibold">Maria Cotton&apos;s Manager</span>

            <div className="space-x-2">
              <button
                type="button"
                onClick={() => openModal("manager")}
                className="rounded border px-3 py-1"
              >
                Edit
              </button>
              <button className="rounded border px-3 py-1 text-red-500">
                Delete
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <img
                src={PLACEHOLDER_AVATAR_LG}
                className="h-10 w-10 rounded-full"
                alt=""
              />

              <div>
                <div className="font-semibold">{managerName}</div>
                <div className="text-xs text-brand">[email protected]</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openModal("manager")}
              className="rounded-md bg-brand px-5 py-2 text-white"
            >
              Change Manager
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow">
          <div className="flex justify-between border-b p-4">
            <span className="font-semibold">Who Reports to Maria Cotton</span>

            <button className="rounded-md bg-brand px-5 py-2 text-white">
              Add people
            </button>
          </div>

          <div className="flex -space-x-3 p-4">
            {[1, 2, 3].map((i) => (
              <img
                key={i}
                src={avatarDataUri(i + 20)}
                className="h-10 w-10 rounded-full border-2 border-white"
                alt=""
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white shadow">
          <div className="border-b p-4 font-semibold">Position</div>

          <div className="space-y-3 p-4">
            <input
              className="w-full rounded-md border px-3 py-3 text-sm"
              placeholder="Job Title"
            />

            <input
              className="w-full rounded-md border px-3 py-3 text-sm"
              placeholder="Permanent"
            />

            <div className="flex gap-3">
              <button className="rounded-md bg-brand px-5 py-2 text-white">
                {teamName} Team Lead
              </button>

              <button className="rounded-md bg-brand px-5 py-2 text-white">
                Permanent
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow">
          <div className="flex justify-between border-b p-4">
            <div>
              <div className="font-semibold">Working Week</div>
              <div className="text-xs text-gray-500">
                Set the dates that your company works.
              </div>
            </div>

            <button className="rounded border px-3 py-1">Edit</button>
          </div>

          <div className="flex flex-wrap gap-2 p-4">
            {["Mon", "Tue", "Wed", "Thur", "Fri"].map((d) => (
              <span
                key={d}
                className="rounded bg-indigo-600 px-3 py-1 text-xs text-white"
              >
                {d}
              </span>
            ))}

            {["Sat", "Sun"].map((d) => (
              <span
                key={d}
                className="rounded bg-red-500 px-3 py-1 text-xs text-white"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ChangeAssignmentModal
        isOpen={activeModal === "manager"}
        title="Change Manager"
        mode="select"
        value={managerName}
        options={managerOptions}
        placeholder="Select Manager"
        onChange={setManagerName}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ChangeAssignmentModal
        isOpen={activeModal === "office"}
        title="Change Office"
        mode="input"
        value={officeName}
        placeholder="Name"
        onChange={setOfficeName}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ChangeAssignmentModal
        isOpen={activeModal === "team"}
        title="Change Team"
        mode="select"
        value={teamName}
        options={teamOptions}
        placeholder="Select Team"
        onChange={setTeamName}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
