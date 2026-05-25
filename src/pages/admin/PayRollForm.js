import React from 'react'

const PayRollForm = () =>
{
    return (
        <div class="p-6 bg-gray-100 min-h-screen">
            <div class="bg-white rounded-xl shadow-md p-6">

                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-600">
                        <thead class="text-xs text-gray-500 uppercase border-b">
                            <tr>
                                <th class="py-3">Team Member</th>
                                <th class="py-3">Email</th>
                                <th class="py-3 text-center">Phone Number</th>
                                <th class="py-3 text-center">Secondary Phone Number</th>
                            </tr>
                        </thead>

                        <tbody class="divide-y">

                            <tr class="hover:bg-gray-50">
                                <td class="py-4 flex items-center gap-3">
                                    <img alt='omage' src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" class="w-10 h-10 rounded-full" />
                                    <span class="font-medium text-gray-800">Danny Ward</span>
                                </td>



                                <td class="text-brand cursor-pointer">
                                    [email protected]
                                </td>

                                <td class="text-center">0982123232</td>
                                <td class="text-center">0982123232</td>
                            </tr>

                            <tr class="hover:bg-gray-50">
                                <td class="py-4 flex items-center gap-3">
                                    <img alt='omage' src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" class="w-10 h-10 rounded-full" />
                                    <span class="font-medium text-gray-800">Linda Craver</span>
                                </td>
                                <td class="text-brand cursor-pointer">
                                    [email protected]
                                </td>

                                <td class="text-center">0982123232</td>
                                <td class="text-center">0982123232</td>
                            </tr>

                            <tr class="hover:bg-gray-50">
                                <td class="py-4 flex items-center gap-3">
                                    <img alt='omage' src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" class="w-10 h-10 rounded-full" />
                                    <span class="font-medium text-gray-800">Jenni Sims</span>
                                </td>
                                <td class="text-brand cursor-pointer">
                                    [email protected]
                                </td>

                                <td class="text-center">0982123232</td>
                                <td class="text-center">0982123232</td>
                            </tr>

                            <tr class="hover:bg-gray-50">
                                <td class="py-4 flex items-center gap-3">
                                    <img alt='omage' src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" class="w-10 h-10 rounded-full" />
                                    <span class="font-medium text-gray-800">Maria Cotton</span>
                                </td>
                                <td class="text-brand cursor-pointer">
                                    [email protected]
                                </td>

                                <td class="text-center">0982123232</td>
                                <td class="text-center">0982123232</td>
                            </tr>



                        </tbody>
                    </table>
                </div>

                <div class="mt-6">
                    <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow">
                        Download Report
                    </button>
                </div>

            </div>
        </div>
    )
}

export default PayRollForm
