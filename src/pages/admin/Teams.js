import React from 'react'

const Teams = ({ teams }) =>
{
    console.log("teams", teams);

    

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team, index) => (
                <div key={index} className="bg-white rounded-xl shadow p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-brand-700">{team.name}</h3>
                        <div className="flex gap-2">
                            <button className="border rounded p-2">✏️</button>
                            <button className="border rounded p-2">🗑️</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                            <img className="w-10 h-10 rounded-full border" alt="imgs" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" />
                            <img className="w-10 h-10 rounded-full border" alt="imgs" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" />
                            <img className="w-10 h-10 rounded-full border" alt="imgs" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" />
                        </div>
                        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg">Add Members</button>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Teams
