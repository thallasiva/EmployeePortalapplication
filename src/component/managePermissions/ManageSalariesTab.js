import React from 'react';
import PermissionViewManageTable from './PermissionViewManageTable';

const salaryRows = [
  {
    key: 'salaryStructure',
    label: 'View Salary Structure',
    description: 'See base salary, allowances, and deductions.',
  },
  {
    key: 'payHistory',
    label: 'Pay History',
    description: 'View monthly payroll records, payouts, and revisions.',
  },
  {
    key: 'bonusDetails',
    label: 'Bonus Details',
    description: 'Access bonuses, incentives, and special compensation entries.',
  },
];

const ManageSalariesTab = ({ values, onToggle }) =>
{
  return (
    <PermissionViewManageTable
      rows={salaryRows}
      values={values}
      onToggle={onToggle}
    />
  );
};

export default ManageSalariesTab;
