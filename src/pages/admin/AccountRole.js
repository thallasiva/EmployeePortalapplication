
import React from 'react';

const AccountRole = ({ roles, onViewPermission }) =>
{
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {roles.map((role, index) => (
        <div key={index} className="relative rounded-xl bg-white p-5 shadow">
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-lg font-semibold text-brand">{role.title}</h3>
            <img src={role.image} alt="avatar" className="h-10 w-10 rounded-full" />
          </div>

          <p className="mb-4 text-sm text-gray-600">{role.description}</p>

          <button
            type="button"
            onClick={() => onViewPermission(role)}
            className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition hover:bg-orange-600"
          >
            View Permission
          </button>
        </div>
      ))}
    </div>
  );
};

export default AccountRole;
