import { getHomePath, persistUser, ROLE_ADMIN } from "./auth";

describe("enterprise role routing", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("routes company administrators to the admin dashboard when the role ID is not legacy", () => {
    expect(getHomePath({
      role: 42,
      roleKeys: ["COMPANY_ADMIN"]
    })).toBe("/dashboard");
  });

  test("persists an admin session using its enterprise role key", () => {
    persistUser({
      email: "company.admin@example.com",
      role: 42,
      roleKeys: ["SUPER_ADMIN"]
    });

    expect(JSON.parse(localStorage.getItem("user")).role).toBe(ROLE_ADMIN);
  });

  test("preserves the original demo-account menu routing", () => {
    const admin = {
      email: "admin@yopmail.com",
      role: 42,
      roleKeys: ["HR_MANAGER"]
    };
    const hrManager = {
      email: "hrmanager@yopmail.com",
      role: 42,
      roleKeys: ["HR_MANAGER"]
    };

    expect(getHomePath(admin)).toBe("/dashboard");
    expect(getHomePath(hrManager)).toBe("/recruiter/recruitment");

    persistUser(hrManager);
    expect(JSON.parse(localStorage.getItem("user")).role).toBe(4);
  });
});
