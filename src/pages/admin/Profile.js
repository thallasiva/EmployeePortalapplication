import { useState } from "react";
import EmployeeProfile from "./EmployeeProfile";
import DetailsScreen from "./EmployeeDetailsProfile";
import { EmployeeDocument } from "./EmployeeDocument";
import PayrollReports from "./PayrollReports";
import ReviewForm from "./ReviewForm";
import SettingsForm from "./SettingsForm";
import TimeOff from "./TimeOff";

const tabs = [
  'Employement',
  'Details',
  'Documents',
  'Payroll',
  'Timeoff',
  'Reviews',
  'Settings',
];

export default function Profile()
{
  const [active, setActive] = useState('Employement');


  const renderTab = () =>
  {
    switch (active)
    {
      case "Employement":
        return <EmployeeProfile />;

      case "Details":
        return <DetailsScreen />;

      case "Documents":
        return <EmployeeDocument />;

      case "Payroll":
        return <PayrollReports />;

      case "Reviews":
        return <ReviewForm />;

      case "Timeoff":
        return <TimeOff />;

        

      case "Settings":
        return <SettingsForm />;

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
      <div className="bg-white p-4 rounded-xl shadow">
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
  // return (
  //   <div className="space-y-6">
  //     <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
  //       <span className="text-gray-500">Home / Profile</span>
  //       <h2 className="font-semibold">Profile</h2>
  //     </div>

  //     <div className="relative bg-white rounded-xl shadow overflow-hidden">
  //       <img
  //         src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d"
  //         alt="cover"
  //         className="w-full h-56 object-cover"
  //       />

  //       <button className="absolute top-4 right-4 bg-brand text-white px-4 py-2 rounded-lg">
  //         Change Office
  //       </button>

  //       <div className="absolute -bottom-10 left-6 flex items-center gap-4">
  //         <img
  //           src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E"
  //           alt="profile"
  //           className="w-20 h-20 rounded-full border-4 border-white"
  //         />
  //         <div>
  //           <h3 className="text-lg font-semibold text-white">John Gibbs</h3>
  //           <p className="text-white/80 text-sm">Super Admin</p>
  //         </div>
  //       </div>
  //     </div>

  //     <div className="bg-white p-5 rounded-xl shadow mt-12">
  //       <h3 className="font-semibold mb-3">Members</h3>
  //       <div className="flex -space-x-2">
  //         {[1, 2, 3, 4, 5].map(i => (
  //           <img
  //             key={i}
  //             src={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E`}
  //             className="w-10 h-10 rounded-full border"
  //             alt="member"
  //           />
  //         ))}
  //       </div>
  //     </div>

  //     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //       <div className="bg-white p-5 rounded-xl shadow">
  //         <h3 className="font-semibold mb-3">Basic Information</h3>
  //         <p className="text-sm"><strong>Email:</strong> john@example.com</p>
  //         <p className="text-sm"><strong>Phone:</strong> +91 9876543210</p>
  //         <p className="text-sm"><strong>Address:</strong> New York, USA</p>
  //       </div>

  //       <div className="bg-white p-5 rounded-xl shadow">
  //         <h3 className="font-semibold mb-3">Company Info</h3>
  //         <p className="text-sm"><strong>Company:</strong> Focus Technologies</p>
  //         <p className="text-sm"><strong>Department:</strong> Development</p>
  //         <p className="text-sm"><strong>Designation:</strong> Team Lead</p>
  //       </div>
  //     </div>
  //   </div>
  // );
}
