export const ONBOARDING_DAYS = 90;

export const CHECKLIST_TEMPLATE = [
  {
    section: "Pre-boarding",
    items: [
      {
        title: "Complete I-9 and tax forms",
        description:
          "Submit all required employment verification and tax documents through the HR portal.",
        dueDays: 0,
      },
    ],
  },
  {
    section: "Day 1",
    items: [
      {
        title: "Set up workstation and install software",
        description:
          "Configure laptop, install required tools, clone repositories, and set up access.",
        dueDays: 1,
      },
      {
        title: "Attend company orientation",
        description:
          "Attend the orientation covering company values, org structure, and benefits.",
        dueDays: 1,
      },
      {
        title: "Meet your onboarding buddy",
        description: "30-minute catch-up with your assigned buddy to get acquainted.",
        dueDays: 1,
      },
    ],
  },
  {
    section: "Week 1",
    items: [
      {
        title: "Explore role and team workflows",
        description:
          "Deep dive into responsibilities, team processes, and coding/operational conventions.",
        dueDays: 7,
      },
      {
        title: "Shadow a senior team member",
        description:
          "Observe a senior colleague conducting their work to learn conventions.",
        dueDays: 7,
      },
      {
        title: "Attend team all-hands",
        description: "Join the weekly team meeting to learn about current priorities.",
        dueDays: 7,
      },
    ],
  },
  {
    section: "Month 1",
    items: [
      {
        title: "Complete security awareness training",
        description:
          "Finish the online security training and phishing simulation exercise.",
        dueDays: 21,
      },
      {
        title: "30-day check-in with manager",
        description: "Discuss how the first month went and set short-term goals.",
        dueDays: 30,
      },
    ],
  },
];
