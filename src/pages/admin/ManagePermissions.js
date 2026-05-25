import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ManageAllTab from '../../component/managePermissions/ManageAllTab';
import ManageDetailsTab from '../../component/managePermissions/ManageDetailsTab';
import ManageSalariesTab from '../../component/managePermissions/ManageSalariesTab';
import ManageTimeOffTab from '../../component/managePermissions/ManageTimeOffTab';

const permissionTabs = [
  { id: 'manage-details', label: 'Manage Details' },
  { id: 'manage-time-off', label: 'Manage Time Off' },
  { id: 'manage-salaries', label: 'Manage Salaries' },
  { id: 'manage-all', label: 'Manage All' },
  { id: 'manage-all-secondary', label: 'Manage All' },
];

const initialPermissions = {
  'manage-details': {
    basicInformation: {
      view: true,
      manage: false,
    },
    contactInformation: {
      view: true,
      manage: false,
    },
    personalProfile: {
      view: false,
      manage: false,
    },
  },
  'manage-time-off': {
    leaveRequests: true,
    bookTimeOff: true,
    manageAllowances: true,
    companySettings: true,
    workFromHome: true,
  },
  'manage-salaries': {
    salaryStructure: {
      view: false,
      manage: false,
    },
    payHistory: {
      view: true,
      manage: false,
    },
    bonusDetails: {
      view: false,
      manage: false,
    },
  },
  'manage-all': {
    employeeDirectory: true,
    reportsAndInsights: false,
    globalSettings: false,
  },
  'manage-all-secondary': {
    employeeDirectory: true,
    reportsAndInsights: true,
    globalSettings: true,
  },
};

const tabComponents = {
  'manage-details': ManageDetailsTab,
  'manage-time-off': ManageTimeOffTab,
  'manage-salaries': ManageSalariesTab,
  'manage-all': ManageAllTab,
  'manage-all-secondary': ManageAllTab,
};

const formatRoleName = (slug) =>
{
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const ManagePermissions = () =>
{
  const navigate = useNavigate();
  const location = useLocation();
  const { roleSlug = '' } = useParams();
  const [activeTab, setActiveTab] = useState('manage-details');
  const [permissions, setPermissions] = useState(initialPermissions);

  const role = location.state?.role;
  const roleCategory = location.state?.roleCategory || 'Manage';
  const roleName = role?.title || formatRoleName(roleSlug);

  const handleToggle = (tabId, rowKey, field) =>
  {
    setPermissions((current) => ({
      ...current,
      [tabId]: {
        ...current[tabId],
        [rowKey]: field
          ? {
            ...current[tabId][rowKey],
            [field]: !current[tabId][rowKey][field],
          }
          : !current[tabId][rowKey],
      },
    }));
  };

  const ActiveComponent = tabComponents[activeTab];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{roleName}</h2>
          <p className="text-sm text-slate-500">{roleCategory} permissions</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/manage')}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
        >
          Back
        </button>
      </div>

      <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap">
          {permissionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-r border-slate-200 px-5 py-3 text-sm font-medium transition last:border-r-0 ${activeTab === tab.id
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ActiveComponent
        values={permissions[activeTab]}
        onToggle={(rowKey, field) => handleToggle(activeTab, rowKey, field)}
      />
    </div>
  );
};

export default ManagePermissions;
