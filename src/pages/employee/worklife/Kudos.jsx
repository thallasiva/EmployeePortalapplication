import React from "react";
import { Award, ThumbsUp, Send } from "lucide-react";
import { getUserInitials } from "../../../lib/dateUtils";

const recentKudos = [
    {
        id: 1,
        name: "Alex Kumar",
        initials: "AK",
        message: "Great teamwork and excellent support on the project!",
        time: "2 hours ago",
    },
    {
        id: 2,
        name: "Priya Sharma",
        initials: "PS",
        message: "Thank you for helping complete the release on time.",
        time: "1 day ago",
    },
    {
        id: 3,
        name: "Rahul Mehta",
        initials: "RM",
        message: "Outstanding presentation to the client team.",
        time: "3 days ago",
    },
];

const Kudos = () =>
{
    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Kudos
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Appreciate and recognize
                        your teammates.
                    </p>
                </div>

                <button className="bg-brand hover:bg-brand-600 text-white px-5 py-2 rounded-lg flex items-center gap-2">
                    <Send size={18} />
                    Give Kudos
                </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div className="bg-white rounded-2xl shadow p-5">
                    <div className="flex items-center gap-3">
                        <Award className="text-yellow-500" />

                        <div>
                            <h2 className="text-lg font-semibold">
                                Total Kudos
                            </h2>

                            <p className="text-3xl font-bold mt-2">
                                24
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-5">
                    <div className="flex items-center gap-3">
                        <ThumbsUp className="text-brand" />

                        <div>
                            <h2 className="text-lg font-semibold">
                                Received
                            </h2>

                            <p className="text-3xl font-bold mt-2">
                                15
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-5">
                    <div className="flex items-center gap-3">
                        <Send className="text-brand" />

                        <div>
                            <h2 className="text-lg font-semibold">
                                Given
                            </h2>

                            <p className="text-3xl font-bold mt-2">
                                9
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* RECENT KUDOS */}
            <div className="bg-white rounded-2xl shadow p-6">

                <h2 className="text-xl font-semibold mb-5">
                    Recent Kudos
                </h2>

                <div className="space-y-4">

                    {recentKudos.map((item) => (
                        <div
                            key={item.id}
                            className="border rounded-xl p-4 flex items-start justify-between"
                        >
                            <div className="flex gap-4">

                                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand">
                                    {item.initials || getUserInitials(item.name)}
                                </div>

                                <div>
                                    <h3 className="font-semibold">
                                        {item.name}
                                    </h3>

                                    <p className="text-sm text-gray-500">
                                        Great teamwork and
                                        excellent support on
                                        the project!
                                    </p>

                                    <p className="text-xs text-gray-400 mt-2">
                                        {item.time}
                                    </p>
                                </div>

                            </div>

                            <Award className="text-yellow-500" />
                        </div>
                    ))}

                </div>

            </div>

        </div>
    );
};

export default Kudos;