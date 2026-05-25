import React from 'react'
import { addCompany } from '../../data/employees';

const CreateCompany = ({ createModal, setCreateModal }) =>
{
    console.log("setCreateModal", createModal);

    const handleClose = () =>
    {
        setCreateModal(false);
    }

    const handleSave = () => {
        const payload = {
            company_name: "NAT IT Solutions Pvt Ltd",
            email: "solutions@natit.com",
            phone: "9876543210",
            perment_address: "123 Main Street, Hyderabad",
            secondary_address: "456 Branch Office, Bangalore",
            company_status: "Yes",
            city: "Hyderabad",
            country: "India",
            postcode: "500001",
            office_register_number: "REG123456",
            created_by: 1,
        };
        addCompany(payload);
        setCreateModal(false);
    };

    return (
        <div>
            <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                <div class="bg-white w-[500px] max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6">

                    <div class="flex items-center justify-between border-b pb-3 mb-4">
                        <h2 class="text-lg font-semibold">
                            Add Company Information
                        </h2>

                        <button class="text-red-500 border border-red-500 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50" onClick={handleClose}>
                            ✕
                        </button>
                    </div>

                    <div class="space-y-3">

                        <div>
                            <label class="text-sm text-gray-700">Office Name</label>
                            <input class="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label class="text-sm text-gray-700">Registered Company Number</label>
                            <input class="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label class="text-sm text-gray-700">Incorporation Date</label>
                            <input class="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label class="text-sm text-gray-700">Vat Number</label>
                            <input class="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label class="text-sm text-gray-700">Address Line 1</label>
                            <input class="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label class="text-sm text-gray-700">Address Line 2</label>
                            <input class="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label class="text-sm text-gray-700">City</label>
                            <input class="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label class="text-sm text-gray-700">Country</label>
                            <input class="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                        </div>

                        <div>
                            <label class="text-sm text-gray-700">Post - Code</label>
                            <input class="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                        </div>

                    </div>

                    <div class="flex gap-3 mt-6 justify-center">

                        <button type="button" class="bg-brand text-white px-6 py-2 rounded" onClick={handleSave}>
                            Add
                        </button>

                        <button class="bg-red-500 text-white px-6 py-2 rounded" onClick={handleClose}>
                            Cancel
                        </button>

                    </div>

                </div>
            </div>
        </div>
    )
}

export default CreateCompany
