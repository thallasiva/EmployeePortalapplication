import React from 'react';
import PermissionViewManageTable from './PermissionViewManageTable';

const detailRows = [
  {
    key: 'basicInformation',
    label: 'Basic Information',
    description: 'Preferred Name, and birthday',
  },
  {
    key: 'contactInformation',
    label: 'Contact Information',
    description: 'Email address, phone number, and emergency contact',
  },
  {
    key: 'personalProfile',
    label: 'Personal Profile',
    description: 'Marital status, gender, and profile summary',
  },
];

const ManageDetailsTab = ({ values, onToggle }) =>
{
  return (
    <PermissionViewManageTable
      rows={detailRows}
      values={values}
      onToggle={onToggle}
    />
  );
};

export default ManageDetailsTab;
