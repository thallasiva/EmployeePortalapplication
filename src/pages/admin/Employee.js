import React, { useState } from 'react';
import Teams from './Teams';
import Offices from './Offices';
import { useNavigate } from 'react-router-dom';
import { getEmployeeList } from '../../data/employees';

export default function Employee()
{

  const navigate = useNavigate();
  const teams = [
    { name: 'PHP' },
    { name: 'Designing' },
    { name: 'iOS' },
    { name: 'Android' },
    { name: 'Business' },
    { name: 'Testing' },
  ];

  const getEmployeesList = getEmployeeList();

 



  const employees = [
    { name: 'Sean Black', team: 'Design' },
    { name: 'Linda Craver', team: 'IOS' },
    { name: 'Jenni Sims', team: 'Android' },
    { name: 'Stacey Linville', team: 'Testing' },
    { name: 'Maria Cotton', team: 'PHP' },
    { name: 'John Gibbs', team: 'PHP' },
    { name: 'Richard Wilson', team: 'Business' },
  ];

  const people = [
    { name: 'Sean Black', manager: 'Richard Wilson', team: 'Design', office: 'Focus Technologies', role: 'Team Lead', status: 'Active' },
    { name: 'Linda Craver', manager: 'Richard Wilson', team: 'iOS', office: 'Focus Technologies', role: 'Team Lead', status: 'Active' },
    { name: 'Jenni Sims', manager: 'Richard Wilson', team: 'Android', office: 'Focus Technologies', role: 'Team Lead', status: 'Active' },
    { name: 'Stacey Linville', manager: 'Richard Wilson', team: 'Testing', office: 'Focus Technologies', role: 'Team Lead', status: 'Active' },
    { name: 'Maria Cotton', manager: 'Richard Wilson', team: 'PHP', office: 'Focus Technologies', role: 'Team Lead', status: 'Active' },
    { name: 'John Gibbs', manager: 'Richard Wilson', team: 'PHP', office: 'Focus Technologies', role: 'Team Lead', status: 'Active' },
    { name: 'Richard Wilson', manager: 'No', team: 'Business', office: 'Focus Technologies', role: 'Super Admin', status: 'Active' },
  ];

  const tabsMenu = [
    { id: 1, tabName: "All" },
    { id: 2, tabName: "Teams" },
    { id: 3, tabName: "Offices" }
  ];
  const [selectedTab, setSelectedTab] = useState("All");

  const setSelectedTabData = (selected) =>
  {
    console.log("selected", selected);
    setSelectedTab(selected);
  }
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">

      <div>
        <button
          onClick={() => setOpen(true)}
          className="bg-brand text-white px-4 py-2 rounded"
        >
          Open Modal
        </button>

        {open && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white w-[400px] rounded-lg p-5 shadow-lg">

              <h2 className="text-lg font-semibold mb-3">
                Create New Team
              </h2>

              <div>
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Name" />
              </div>

              <div className="flex justify-start gap-2 mt-3">
                <div className="flex gap-4">
                  <button className="bg-orange-500 text-white px-6  rounded-lg shadow">Add</button>
                  <button className="bg-red-500 text-white px-6  rounded-lg shadow" onClick={() => setOpen(false)}>Cancel</button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex bg-white rounded-xl shadow overflow-hidden">
          {
            tabsMenu.map(item => (
              <button className={`${selectedTab === item.tabName
                ? "selected px-6 py-2"
                : "notSelected px-6 py-2"
                }`} key={item.id}

                onClick={() => setSelectedTabData(item.tabName)}
              > {item.tabName}</button>
            ))
          }
        </div>

        <button className="bg-brand text-white px-4 py-2 rounded-xl shadow" onClick={() => navigate('/dashboard/create-employee')}>+ Add Person</button>
      </div>

      {
        selectedTab === 'All' && (
          <div className="space-y-6">


            {/* Count + View Toggle */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow">
              <span className="font-medium">{getEmployeesList.length} Employees</span>
              <div className="flex gap-2">
                <button className="p-2 border rounded-lg">▦</button>
                <button className="p-2 border rounded-lg bg-brand text-white">≡</button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Reporting Manager</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Permissions</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getEmployeesList.map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 font-medium">{p.first_name}{p.lasst_name}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded border ${p.manager === 'No' ? 'border-red-500 text-red-500' : 'border-blue-500 text-brand'}`}>
                          {p.reporting_to}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-3 py-1 border border-orange-500 text-orange-500 rounded">{p.emp_job_title}</span>
                      </td>
                      <td className="p-3">{p.email}</td>
                      <td className="p-3">{p.role === 1 ? "Admin":'Employee'}</td>
                      <td className="p-3">
                        <select className="border border-brand text-brand px-2 py-1 rounded">
                          <option>{p.employee_status}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {selectedTab === 'Teams' && (
        <Teams teams={teams} />
      )}
      {
        selectedTab === 'Offices' && (

          <Offices employees={employees} />

        )
      }





    </div>
  );
}


