import React, { useState } from 'react';
import TeamReports from './TeamReports';
import LeaveReports from './LeaveReports';
import PayrollReports from './PayrollReports';
import ContactReports from './ContactReports';
import EmailReports from './EmailReports';
import SecurityReports from './SecurityReports';
import WFHReports from './WFHReports';

const tabs = [
  'Team Reports',
  'Leave Reports',
  'Payroll Reports',
  'Contact Reports',
  'Email Reports',
  'Security Reports',
  'WFH Reports',
];

export default function Reports()
{
  const [active, setActive] = useState('Team Reports');


  const renderTab = () =>
  {
    switch (active)
    {
      case "Team Reports":
        return <TeamReports />;

      case "Leave Reports":
        return <LeaveReports />;

      case "Payroll Reports":
        return <PayrollReports />;

      case "Contact Reports":
        return <ContactReports />;

      case "Email Reports":
        return <EmailReports />;

      case "Security Reports":
        return <SecurityReports />;

      case "WFH Reports":
        return <WFHReports />;

      default:
        return <div>No Data</div>;
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
        <span className="text-gray-500">Home / Reports</span>
        <h2 className="font-semibold">Reports</h2>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex bg-white rounded-xl shadow overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-4 py-2  ${active === tab
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {renderTab()}

    </div>
  );
}
