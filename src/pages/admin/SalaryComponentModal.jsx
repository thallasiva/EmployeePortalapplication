import { useState } from "react";

const SalaryComponentModal = ({
    onClose,
    onSave
}) =>
{

    const [name, setName] = useState("");

    const [type, setType] = useState("earning");

    const [formula, setFormula] = useState("");

    const availableFields = [
        "gross",
        "basic",
        "hra",
        "conveyance",
        "medicalAllowance",
        "specialAllowance",

        // Deductions
        "pf",
        "esi",
        "professionalTax",
        "tds"
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">

            <div className="bg-white rounded-lg w-full max-w-xl p-6">

                <h3 className="text-xl font-semibold mb-4">
                    Add Salary Component
                </h3>

                <div className="mb-4">
                    <label>Name</label>

                    <input
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        className="w-full border rounded p-3"
                    />
                </div>

                <div className="mb-4">

                    <label>
                        <input
                            type="radio"
                            checked={type === "earning"}
                            onChange={() =>
                                setType("earning")
                            }
                        />

                        Earning
                    </label>

                    <label className="ml-4">
                        <input
                            type="radio"
                            checked={type === "deduction"}
                            onChange={() =>
                                setType("deduction")
                            }
                        />

                        Deduction
                    </label>

                </div>

                <div className="mb-3">

                    <label>
                        Formula
                    </label>

                    <textarea
                        rows={3}
                        value={formula}
                        onChange={(e) =>
                            setFormula(e.target.value)
                        }
                        className="w-full border rounded p-3"
                    />

                </div>

                <div className="mb-4">

                    <p className="font-medium mb-2">
                        Available Fields
                    </p>

                    <div className="flex flex-wrap gap-2">

                        {availableFields.map(field => (
                            <button
                                key={field}
                                type="button"
                                onClick={() =>
                                    setFormula(
                                        prev =>
                                            prev + " " + field
                                    )
                                }
                                className="px-3 py-1 rounded bg-gray-100"
                            >
                                {field}
                            </button>
                        ))}

                        <button
                            onClick={() =>
                                setFormula(prev => prev + " + ")
                            }
                        >
                            +
                        </button>

                        <button
                            onClick={() =>
                                setFormula(prev => prev + " - ")
                            }
                        >
                            -
                        </button>

                        <button
                            onClick={() =>
                                setFormula(prev => prev + " * ")
                            }
                        >
                            *
                        </button>

                        <button
                            onClick={() =>
                                setFormula(prev => prev + " / ")
                            }
                        >
                            /
                        </button>

                    </div>

                </div>

                <div className="flex justify-end gap-2">

                    <button
                        onClick={onClose}
                        className="border px-4 py-2 rounded"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() =>
                            onSave({
                                name,
                                type,
                                formula
                            })
                        }
                        className="bg-orange-500 text-white px-4 py-2 rounded"
                    >
                        Save
                    </button>

                </div>

            </div>

        </div>
    );
};

export default SalaryComponentModal;