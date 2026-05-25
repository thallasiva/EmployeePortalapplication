// import React from 'react'

// const Review = () => {
//   return (
//     <div>
//       <p> Dashboard</p>

//     </div>
//   )
// }

// export default Review


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewType from './ReviewType';

export default function Review()
{

  const tabsMenu = [
    { id: 1, tabName: "Overview" },
    { id: 2, tabName: "Review Types" }
  ];
  const [selectedTab, setSelectedTab] = useState("Overview");
    const reviews = [
    { employee: 'Linda Craver', from: '05 Dec 2019', to: '07 Dec 2019', status: 'In Progress' },
    { employee: 'Jenni Sims', from: '05 Dec 2019', to: '07 Dec 2019', status: 'Completed' },
  ];

  const navigate = useNavigate();

  const setSelectedTabData = (selected) =>
  {
    console.log("selected", selected);
    setSelectedTab(selected);
  }

  return (

    <div className="space-y-6">

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

        <button className="bg-brand text-white px-4 py-2 rounded-lg"  onClick={() => navigate('/dashboard/create-review')}>Create Review</button>
      </div>
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
        <span className="text-gray-500">Home / Reviews</span>

      </div>

      {/* Table */}

      {
        selectedTab === 'Overview' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Review Name</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">Employee Review</td>
                    <td className="p-3">{item.employee}</td>
                    <td className="p-3">{item.from}</td>
                    <td className="p-3">{item.to}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded border text-sm ${item.status === 'Completed'
                          ? 'border-brand text-brand'
                          : 'border-orange-500 text-orange-500'
                          }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 space-x-2">
                      <button className="border px-3 py-1 rounded text-brand">Edit</button>
                      <button className="border px-3 py-1 rounded text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

       {
        selectedTab === 'Review Types' && (
          // <div className="bg-white rounded-xl shadow overflow-hidden">
          //   <table className="w-full text-sm">
          //     <thead className="bg-gray-100 text-left">
          //       <tr>
          //         <th className="p-3">Review Name</th>
          //         <th className="p-3">Employee</th>
          //         <th className="p-3">From</th>
          //         <th className="p-3">To</th>
          //         <th className="p-3">Status</th>
          //         <th className="p-3">Action</th>
          //       </tr>
          //     </thead>
          //     <tbody>
          //       {reviews.map((item, index) => (
          //         <tr key={index} className="border-t">
          //           <td className="p-3">Employee Review</td>
          //           <td className="p-3">{item.employee}</td>
          //           <td className="p-3">{item.from}</td>
          //           <td className="p-3">{item.to}</td>
          //           <td className="p-3">
          //             <span
          //               className={`px-3 py-1 rounded border text-sm ${item.status === 'Completed'
          //                 ? 'border-brand text-brand'
          //                 : 'border-orange-500 text-orange-500'
          //                 }`}
          //             >
          //               {item.status}
          //             </span>
          //           </td>
          //           <td className="p-3 space-x-2">
          //             <button className="border px-3 py-1 rounded text-brand">Edit</button>
          //             <button className="border px-3 py-1 rounded text-red-600">Delete</button>
          //           </td>
          //         </tr>
          //       ))}
          //     </tbody>
          //   </table>
          // </div>
          <ReviewType />
        )
      }

    </div>
  );
}

// export function CreateReview()
// {

// }
