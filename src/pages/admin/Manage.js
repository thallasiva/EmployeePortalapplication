import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountRole from './AccountRole';
import LeadershipRole from './LeadershipRole';
import { PLACEHOLDER_AVATAR } from '../../lib/placeholders';

const tabs = [
  'Account Roles',
  'Leadership Roles'
];

export default function Manage()
{
  const navigate = useNavigate();

  const [active, setActive] = useState('Account Roles');

  const roles = [
    {
      title: 'Super Admin',
      description: 'They can see and do everything – best not to have many with this role.',
      image: PLACEHOLDER_AVATAR,
    },
    {
      title: 'Admin',
      description: 'Admin to help sort stuff, but have less access to confidential information like salaries.',
      image: PLACEHOLDER_AVATAR,
    },
    {
      title: 'Payroll Admin',
      description: "They sort out your payroll and have access to everyone's salary information.",
      image: PLACEHOLDER_AVATAR,
    },
    {
      title: 'Team Member',
      description: 'Team Members have the most limited access – most people should have this role.',
      image: PLACEHOLDER_AVATAR,
    },
  ];

  const handleViewPermission = (role) =>
  {
    const roleSlug = role.title.toLowerCase().replace(/\s+/g, '-');
    navigate(`/dashboard/manage/permissions/${roleSlug}`, {
      state: {
        role,
        roleCategory: active,
      },
    });
  };

  const renderTab = () =>
  {
    switch (active)
    {
      case "Account Roles":
        return <AccountRole roles={roles} onViewPermission={handleViewPermission} />;

      case "Leadership Roles":
        return <LeadershipRole roles={roles} onViewPermission={handleViewPermission} />;


      default:
        return <div>No Data</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
        <span className="text-gray-500">Home / Manage</span>
        <h2 className="font-semibold">Manage</h2>
      </div>

      {/* Tabs */}
      <div className="flex w-fit bg-white rounded-xl shadow overflow-hidden">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-4 py-2 whitespace-nowrap ${active === tab
              ? 'bg-brand text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Roles */}
      {renderTab()}
    </div>
  );
}
