import React from "react";

const NOTIFICATION_ITEMS = [
  { key: 'leaveRequests',      label: 'Leave Requests',       description: 'New leave requests and approvals' },
  { key: 'performanceReviews', label: 'Performance Reviews',  description: 'Review cycles and deadlines' },
  { key: 'onboarding',         label: 'Onboarding',           description: 'Task assignments and progress' },
];

const NotificationPreferences = React.memo(function NotificationPreferences({ notifications, toggleNotif }) {
  return (
    <section className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-slate-900">Notification Preferences</h2>
      <p className="mt-1 text-sm text-gray-500">Choose how you want to be notified</p>

      <div className="mt-6 space-y-6">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.key} className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_1fr] items-center rounded-3xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <p className="font-semibold text-slate-900">{item.label}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            {['email', 'push', 'inApp'].map((channel) => (
              <label key={channel} className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={notifications[item.key][channel]}
                  onChange={() => toggleNotif(item.key, channel)}
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/50"
                />
                {channel === 'inApp' ? 'In-app' : channel.charAt(0).toUpperCase() + channel.slice(1)}
              </label>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition">
          Save Changes
        </button>
      </div>
    </section>
  );
});

export default NotificationPreferences;
