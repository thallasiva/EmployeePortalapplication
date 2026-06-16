import React, { useMemo, useState } from "react";
import { ChevronRight, Clock3, Star, User2 } from "lucide-react";
import "./Onboarding.css";

const overviewStats = [
  {
    value: 2,
    label: "Active Onboardings",
    icon: <User2 size={18} />,
  },
  {
    value: "28d",
    label: "Avg Completion Time",
    icon: <Clock3 size={18} />,
  },
  {
    value: "4.6/5",
    label: "Satisfaction Score",
    icon: <Star size={18} />,
  },
];

const overdueTasks = [
  {
    title: "Attend engineering all-hands",
    owner: "Kevin Zhao",
    due: "Due Mar 10",
  },
  {
    title: "Set up monitoring and alerting access",
    owner: "Kevin Zhao",
    due: "Due Mar 10",
  },
  {
    title: "Shadow a code review session",
    owner: "Kevin Zhao",
    due: "Due Mar 14",
  },
  {
    title: "Complete security training",
    owner: "Kevin Zhao",
    due: "Due Mar 21",
  },
  {
    title: "30-day check-in with manager",
    owner: "Amanda Wright",
    due: "Due Mar 19",
  },
];

const activeOnboardings = [
  {
    id: "kevin-zhao",
    name: "Kevin Zhao",
    title: "Junior Frontend Engineer",
    team: "Engineering",
    start: "Mar 3, 2026",
    buddy: "Aisha Rahman",
    daysLeft: 0,
    progress: 42,
    tasks: [
      {
        section: "Pre-boarding",
        completed: 1,
        total: 1,
        items: [
          {
            title: "Complete I-9 and tax forms",
            description: "Submit all required employment verification and tax documents through the HR portal.",
            due: "Due Mar 3",
            status: "Completed",
          },
        ],
      },
      {
        section: "Day 1",
        completed: 2,
        total: 3,
        items: [
          {
            title: "Install required software",
            description: "Install VS Code, Node.js, Docker, Git. Clone the monorepo.",
            due: "Due Mar 3",
            status: "Completed",
          },
          {
            title: "Attend company orientation",
            description: "Attend the 90-minute orientation covering company values, org structure, and benefits.",
            due: "Due Mar 3",
            status: "Completed",
          },
          {
            title: "Meet your onboarding buddy",
            description: "30-minute catch-up with your assigned buddy to get acquainted.",
            due: "Due Mar 3",
            status: "Pending",
          },
        ],
      },
      {
        section: "Week 1",
        completed: 2,
        total: 5,
        items: [
          {
            title: "Explore codebase and team workflows",
            description: "Deep dive into the frontend architecture, folder structure, and coding conventions.",
            due: "Due Mar 7",
            status: "Completed",
          },
          {
            title: "Create first PR and team review",
            description: "Pick up a good first issue from the backlog and submit your first pull request.",
            due: "Due Mar 10",
            status: "Completed",
          },
          {
            title: "Attend engineering all-hands",
            description: "Join the weekly engineering all-hands to learn about current priorities.",
            due: "Due Mar 10",
            status: "Pending",
          },
          {
            title: "Set up monitoring and alerting access",
            description: "Get access to Datadog, PagerDuty, and Sentry dashboards.",
            due: "Due Mar 10",
            status: "Pending",
          },
          {
            title: "Shadow a code review session",
            description: "Observe a senior engineer conducting code reviews to learn team conventions.",
            due: "Due Mar 14",
            status: "Pending",
          },
        ],
      },
      {
        section: "Month 1",
        completed: 0,
        total: 3,
        items: [
          {
            title: "Complete security training",
            description: "Finish the online security awareness training and phishing simulation.",
            due: "Due Mar 21",
            status: "Pending",
          },
          {
            title: "Ship a feature independently",
            description: "Take ownership of a small feature from idea to production.",
            due: "Due Mar 31",
            status: "Pending",
          },
          {
            title: "30-day check-in with manager",
            description: "Sit down with your manager to discuss how the first month went and set short-term goals.",
            due: "Due Apr 2",
            status: "Pending",
          },
        ],
      },
    ],
  },
  {
    id: "amanda-wright",
    name: "Amanda Wright",
    title: "Product Analyst",
    team: "Product",
    start: "Feb 17, 2026",
    buddy: "Ryan",
    daysLeft: 0,
    progress: 88,
    tasks: [],
  },
];

const completedOnboardings = [
  {
    name: "Sophia Lee",
    role: "HR Coordinator",
    status: "Completed",
    start: "Sep 15, 2025",
    buddy: "Nathan Cooper",
    progress: 100,
  },
];

export default function Onboarding() {
  const [selectedOnboarding, setSelectedOnboarding] = useState(activeOnboardings[0]);
  const activeTasks = useMemo(() => selectedOnboarding?.tasks ?? [], [selectedOnboarding]);

  return (
    <div className="admin-onboarding space-y-8 pb-20">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Onboarding</h1>
            <p className="text-sm text-slate-500">Track and manage new hire onboarding progress</p>
          </div>
          <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
            Updated today
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {overviewStats.map((stat) => (
            <div key={stat.label} className="onboarding-stat-card">
              <div className="onboarding-stat-card__icon">{stat.icon}</div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="onboarding-overdue-panel">
        <div className="onboarding-overdue-header">
          <div>
            <p className="text-sm font-semibold text-amber-800">Overdue Tasks (5)</p>
          </div>
          <span className="onboarding-overdue-tag">Review now</span>
        </div>
        <div className="onboarding-overdue-list">
          {overdueTasks.map((task) => (
            <div key={task.title} className="onboarding-overdue-item">
              <div>
                <p className="font-semibold text-slate-900">{task.title}</p>
                <p className="text-sm text-slate-500">{task.owner} - {task.due}</p>
              </div>
              <span className="onboarding-overdue-status">Overdue</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Active Onboardings</h2>
            <p className="text-sm text-slate-500">Monitor progress and actions for new hires currently in onboarding.</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {activeOnboardings.map((profile) => (
            <div key={profile.id} className="onboarding-card">
              <div className="onboarding-card__top">
                <div>
                  <div className="onboarding-avatar">{profile.name.split(" ").map((n) => n[0]).join("")}</div>
                  <div className="mt-3">
                    <p className="text-lg font-semibold text-slate-900">{profile.name}</p>
                    <p className="text-sm text-slate-500">{profile.title} - {profile.team}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="onboarding-active-badge">Active</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-5 text-sm text-slate-500">
                <div>
                  <p className="font-medium text-slate-900">Start Date</p>
                  <p className="mt-1">{profile.start}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Buddy</p>
                  <p className="mt-1">{profile.buddy}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Days Left</p>
                  <p className="mt-1">{profile.daysLeft}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Progress</p>
                  <p className="mt-1">{profile.progress}%</p>
                </div>
              </div>

              <div className="onboarding-progress-bar">
                <div className="onboarding-progress-bar__fill" style={{ width: `${profile.progress}%` }} />
              </div>

              <button type="button" className="onboarding-view-checklist" onClick={() => setSelectedOnboarding(profile)}>
                View Checklist <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {selectedOnboarding && (
        <section className="onboarding-checklist-panel">
          <div className="onboarding-checklist-header">
            <div>
              <p className="text-sm text-slate-500">{selectedOnboarding.title} · {selectedOnboarding.team}</p>
              <h2 className="text-2xl font-semibold text-slate-900">{selectedOnboarding.name}</h2>
              <div className="flex flex-wrap gap-3 items-center text-sm text-slate-500 mt-3">
                <span>Started {selectedOnboarding.start}</span>
                <span>• Buddy: {selectedOnboarding.buddy}</span>
              </div>
            </div>
            <div className="onboarding-checklist-actions">
              <button type="button" className="onboarding-custom-task-btn">+ Add Custom Task</button>
              <div className="onboarding-checklist-progress-circle">
                <span>{selectedOnboarding.progress}%</span>
              </div>
            </div>
          </div>

          <div className="onboarding-checklist-groups">
            {activeTasks.map((group) => (
              <div key={group.section} className="onboarding-group-card">
                <div className="onboarding-group-header">
                  <div>
                    <p className="font-semibold text-slate-900">{group.section}</p>
                    <p className="text-sm text-slate-500">{group.completed}/{group.total} completed</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {group.items.map((task) => (
                    <div key={task.title} className="onboarding-task-item">
                      <div className="onboarding-task-status">
                        <span className={`onboarding-task-dot ${task.status === "Completed" ? "completed" : "pending"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        <div className="flex flex-wrap gap-2 items-center mt-2 text-xs text-slate-400">
                          <span>{task.due}</span>
                          <span className={`onboarding-task-badge ${task.status === "Completed" ? "completed" : "pending"}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="onboarding-completed-panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Completed Onboardings (1)</h2>
            <p className="text-sm text-slate-500">Review recently finished onboarding journeys.</p>
          </div>
          <span className="onboarding-completed-badge">Closed</span>
        </div>

        <div className="space-y-3">
          {completedOnboardings.map((item) => (
            <div key={item.name} className="onboarding-completed-card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="onboarding-avatar">{item.name.split(" ").map((n) => n[0]).join("")}</div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.role} · Started {item.start}</p>
                    <p className="text-sm text-slate-500 mt-1">Buddy: {item.buddy}</p>
                  </div>
                </div>
                <div className="onboarding-completed-progress">
                  <span className="text-sm font-semibold text-slate-900">{item.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
