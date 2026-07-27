export const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#f18200", "#f18200",
];

export const REVIEW_CYCLES = [
  {
    id: 1,
    cycle: "Q1 2026 Performance Review",
    period: "Jan 2026 – Mar 2026",
    dueDate: "15 Apr 2026",
    status: "Completed",
    reviews: [
      {
        id: 101,
        employee: "Arjun Mehta",
        role: "Senior Frontend Developer",
        reviewer: "Priya Sharma",
        overallRating: 4.5,
        categories: [
          { name: "Technical Skills", rating: 5 },
          { name: "Teamwork", rating: 4 },
          { name: "Communication", rating: 4 },
          { name: "Delivery", rating: 5 },
        ],
        comments:
          "Exceptional work on the new dashboard. Consistently delivers high-quality code and mentors junior team members effectively.",
        status: "Completed",
      },
      {
        id: 102,
        employee: "Sneha Rao",
        role: "HR Manager",
        reviewer: "Vikram Singh",
        overallRating: 4.0,
        categories: [
          { name: "Technical Skills", rating: 4 },
          { name: "Teamwork", rating: 5 },
          { name: "Communication", rating: 4 },
          { name: "Delivery", rating: 3 },
        ],
        comments:
          "Strong collaboration skills and excellent onboarding process design. Should focus on deadline adherence for process documentation.",
        status: "Completed",
      },
      {
        id: 103,
        employee: "Rahul Nair",
        role: "Backend Developer",
        reviewer: "Priya Sharma",
        overallRating: 3.5,
        categories: [
          { name: "Technical Skills", rating: 4 },
          { name: "Teamwork", rating: 3 },
          { name: "Communication", rating: 3 },
          { name: "Delivery", rating: 4 },
        ],
        comments:
          "Good technical foundation. Needs to improve cross-team communication and proactive status updates.",
        status: "Completed",
      },
    ],
  },
  {
    id: 2,
    cycle: "Q2 2026 Performance Review",
    period: "Apr 2026 – Jun 2026",
    dueDate: "15 Jul 2026",
    status: "In Progress",
    reviews: [
      {
        id: 201,
        employee: "Arjun Mehta",
        role: "Senior Frontend Developer",
        reviewer: "Priya Sharma",
        overallRating: null,
        categories: [
          { name: "Technical Skills", rating: null },
          { name: "Teamwork", rating: null },
          { name: "Communication", rating: null },
          { name: "Delivery", rating: null },
        ],
        comments: "",
        status: "In Progress",
      },
      {
        id: 202,
        employee: "Divya Krishnan",
        role: "UI/UX Designer",
        reviewer: "Vikram Singh",
        overallRating: null,
        categories: [],
        comments: "",
        status: "Pending",
      },
      {
        id: 203,
        employee: "Rahul Nair",
        role: "Backend Developer",
        reviewer: "Priya Sharma",
        overallRating: null,
        categories: [],
        comments: "",
        status: "Not Started",
      },
    ],
  },
];

export const REVIEW_STATUSES = ["All", "Completed", "In Progress", "Pending", "Not Started"];
