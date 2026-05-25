import React from 'react';
import PermissionAllowTable from './PermissionAllowTable';

const manageAllRows = [
  {
    key: 'employeeDirectory',
    label: 'Employee Directory',
    description: 'Combined access to profile, leave, and salary records.',
  },
  {
    key: 'reportsAndInsights',
    label: 'Reports and Insights',
    description: 'Overview reports, workforce analytics, and audit details.',
  },
  {
    key: 'globalSettings',
    label: 'Global Settings',
    description: 'Permissions that affect all manage module screens.',
  },
];

const ManageAllTab = ({ values, onToggle }) =>
{
  return (
    <PermissionAllowTable
      rows={manageAllRows}
      values={values}
      onToggle={onToggle}
    />
  );
};

export default ManageAllTab;
