import React from 'react';
import PermissionAllowTable from './PermissionAllowTable';

const timeOffRows = [
  {
    key: 'leaveRequests',
    label: 'Approve or Deny Time Off',
    description: 'Manage time off requests for anyone in their team.',
  },
  {
    key: 'bookTimeOff',
    label: 'Book Time Off Behalf',
    description: 'Book time off for anyone in their team.',
  },
  {
    key: 'manageAllowances',
    label: 'Manage Allowances',
    description: 'Adjust the holiday allowance for people in their team.',
  },
  {
    key: 'companySettings',
    label: 'Manage Time Off settings for The Company',
    description: 'Manage custom leave types, roll over, company holidays and restricted days, the company working week, and your company holiday allowance.',
  },
  {
    key: 'workFromHome',
    label: 'Manage Working From Home',
    description: 'Create, edit, or delete working from home requests for people in their team.',
  },
];

const ManageTimeOffTab = ({ values, onToggle }) =>
{
  return (
    <PermissionAllowTable
      rows={timeOffRows}
      values={values}
      onToggle={onToggle}
    />
  );
};

export default ManageTimeOffTab;
