import React, { useState } from "react";
import
{
  BarChart3,
  Briefcase,
  CalendarCheck,
  CheckCircle,
  FileCheck,
  Filter,
  LayoutDashboard,
  Plus,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import * as Yup from "yup";
import { getStoredUser, isAdmin, isRecruiter, isRecruiterLead } from "../../data/auth";
import InterviewFeedback from "./InterviewFeedback";
import ScheduleInterview from "./ScheduleInterview";

const COLORS = { admin: "#1a2535", manager: "#7c3aed", recruiter: "#f18200" };

const RECRUITERS = [
  { key: "Mike W.", name: "Mike Williams", email: "recruiter@yopmail.com" },
  { key: "Emily D.", name: "Emily Davis", email: "recruiter2@yopmail.com" },
];

const JOB_REQUESTS = [
  {
    "Job Title": "Sr. React Developer",
    "Job ID": "JOB-001",
    Client: "ABC Ltd",
    "Company/Department": "NAT IT / Engineering",
    "Bill Rate": "1200/hr",
    "Pay Rate": "950/hr",
    "Position Type": "Contract",
    "Job Status": "Active",
    "Business Unit": "Nat IT",
    "Recruiter Assignment Status": "Open",
    "Job Description": "React, Node.js, SQL",
    "Select Recruiter": "Mike W.",
    "My Tasks": "Source 5 profiles",
    Status: "Work in Progress",
  },
  {
    "Job Title": "QA Engineer",
    "Job ID": "JOB-002",
    Client: "Tech Solutions",
    "Company/Department": "NAT IT / Quality Assurance",
    "Bill Rate": "850/hr",
    "Pay Rate": "650/hr",
    "Position Type": "Contract to Hire",
    "Job Status": "Active",
    "Business Unit": "Natsoft",
    "Recruiter Assignment Status": "Completed",
    "Job Description": "Automation, API testing",
    "Select Recruiter": "Emily D.",
    "My Tasks": "Shortlist candidates",
    Status: "Closed",
  },
  {
    "Job Title": "DevOps Engineer",
    "Job ID": "JOB-003",
    Client: "CloudTech",
    "Company/Department": "NAT IT / Infrastructure",
    "Bill Rate": "1400/hr",
    "Pay Rate": "1100/hr",
    "Position Type": "Direct Hire",
    "Job Status": "In Active",
    "Business Unit": "Nat IT",
    "Recruiter Assignment Status": "Hold",
    "Job Description": "AWS, CI/CD, Docker",
    "Select Recruiter": "Mike W.",
    "My Tasks": "Await client confirmation",
    Status: "Work in Progress",
  },
];

const CANDIDATES = [
  {
    "Job ID": "JOB-001",
    Name: "Ravi Kumar",
    Email: "ravi.kumar@email.com",
    Mobile: "9876543210",
    "Total Experience": "5 yrs",
    "Relevant Experience": "4 yrs",
    "Current CTC": "12 LPA",
    "Expected CTC": "16 LPA",
    "Last Working Day (LWD)": "30-Jul-2026",
    "Skill Set": "React, Node.js",
    Gender: "Male",
    "Attach File": "ravi_resume.pdf",
    "PIN Code": "500081",
    City: "Hyderabad",
    State: "Telangana",
    District: "Rangareddy",
    Recruiter: "Mike W.",
    Status: "Schedule Interview",
  },
  {
    "Job ID": "JOB-002",
    Name: "Meera K.",
    Email: "meera.k@email.com",
    Mobile: "9876501234",
    "Total Experience": "4 yrs",
    "Relevant Experience": "3 yrs",
    "Current CTC": "11 LPA",
    "Expected CTC": "14 LPA",
    "Last Working Day (LWD)": "Serving notice",
    "Skill Set": "Selenium, API",
    Gender: "Female",
    "Attach File": "meera_resume.pdf",
    "PIN Code": "600096",
    City: "Chennai",
    State: "Tamil Nadu",
    District: "Chennai",
    Recruiter: "Emily D.",
    Status: "Shortlisted",
  },
];

const INTERVIEWS = [
  {
    Candidate: "Ravi Kumar",
    Level: "Level 1",
    "Type of Interview": "OnCall",
    "Interview Date": "Today",
    time: "11:00 AM",
    Subject: "Level 1 Technical Discussion",
    "Start/End time": "11:00 AM - 11:45 AM",
    Participants: "Alex Smith",
    Others: "HR Manager",
    "Feedback Status": "Selected",
    "Feedback Comments": "Strong React fundamentals",
    Recruiter: "Mike W.",
  },
  {
    Candidate: "Meera K.",
    Level: "Level 2",
    "Type of Interview": "Microsoft Teams",
    "Interview Date": "Tomorrow",
    time: "04:30 PM",
    Subject: "QA Automation Round",
    "Start/End time": "04:30 PM - 05:15 PM",
    Participants: "Sarah Lead",
    Others: "Emily D.",
    "Feedback Status": "Hold",
    "Feedback Comments": "Awaiting client panel",
    Recruiter: "Emily D.",
  },
];

const OFFER_ROWS = [
  {
    Candidate: "Meera K.",
    "Date of Joining": "15-Jul-2026",
    "CTC Amount": "14 LPA",
    Basic: "5.6 LPA",
    HRA: "2.8 LPA",
    "Telephone/Internet Allowance": "0.3 LPA",
    "Special Allowance": "3.1 LPA",
    "Gross Salary": "11.8 LPA",
    "PF Contribution": "0.67 LPA",
    "Statutory Bonus": "0.25 LPA",
    Gratuity: "0.27 LPA",
    ESI: "N/A",
    "Cost to Company": "14 LPA",
    "CTC Amount in Words": "Fourteen Lakhs Only",
    Designation: "QA Engineer",
    Status: "Offer Released and Accepted",
  },
];

const ONBOARDING_ROWS = [
  {
    Candidate: "Meera K.",
    "Current Status of Employee": "In Progress",
    "Effective Date": "15-Jul-2026",
    Onboard: "Pending HR verification",
    "Review Forms Submitted": "Yes",
  },
];

const STATUS_REFERENCE = [
  "Work in Progress",
  "Schedule Interview",
  "Shortlisted",
  "Offer Released and Accepted",
  "In Progress",
  "Onboarded",
];

const badgeColor = (value) =>
{
  if (["Active", "Selected", "Shortlisted", "Onboarded", "Completed", "Closed"].includes(value)) return "green";
  if (["Hold", "Review", "In Progress", "Work in Progress"].includes(value)) return "orange";
  if (["In Active", "Not Selected"].includes(value)) return "red";
  return "blue";
};

function getRecruiterKey(user)
{
  const email = user?.email?.toLowerCase();
  return RECRUITERS.find((item) => item.email === email)?.key || "Mike W.";
}

function roleInfo(user)
{
  if (isAdmin(user)) return { id: 1, label: "Admin", color: COLORS.admin };
  if (isRecruiterLead(user)) return { id: 4, label: "HR / Recruiter Manager", color: COLORS.manager };
  if (isRecruiter(user)) return { id: 5, label: "Recruiter", color: COLORS.recruiter };
  return { id: 1, label: "Admin", color: COLORS.admin };
}

function Badge({ children, color = "gray" })
{
  const map = {
    blue: ["#dbeafe", "#1e40af"],
    green: ["#dcfce7", "#166534"],
    gray: ["#f3f4f6", "#4b5563"],
    orange: ["#fff7ed", "#c2410c"],
    red: ["#fee2e2", "#991b1b"],
    purple: ["#ede9fe", "#5b21b6"],
  };
  const [bg, fg] = map[color] || map.gray;
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: bg, color: fg }}>{children}</span>;
}

function Btn({ children, primary, small, onClick, type = "button" })
{
  return (
    <button type={type} onClick={onClick} style={{
      border: primary ? "none" : "0.5px solid #d1d5db",
      background: primary ? "#f18200" : "#fff",
      color: primary ? "#fff" : "#374151",
      borderRadius: 6,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: small ? 11 : 12,
      fontWeight: 600,
      padding: small ? "4px 9px" : "7px 13px",
    }}>
      {children}
    </button>
  );
}

function Card({ title, action, children })
{
  return (
    <section style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "10px 14px", borderBottom: "0.5px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h2>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Stat({ icon: Icon, label, value, note, color = "#f18200" })
{
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>{value}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
          {note && <div style={{ fontSize: 11, color, marginTop: 4 }}>{note}</div>}
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}18`, display: "grid", placeItems: "center" }}>
          <Icon size={17} color={color} />
        </div>
      </div>
    </div>
  );
}

function inputStyle()
{
  return { width: "100%", border: "0.5px solid #d1d5db", borderRadius: 6, padding: "7px 9px", fontSize: 12, background: "#fff", color: "#111827" };
}

function errorStyle()
{
  return { color: "#dc2626", fontSize: 10, marginTop: 4 };
}

const requiredText = (label) => Yup.string().trim().required(`${label} is required`);
const positiveNumber = (label) => Yup.number().typeError(`${label} must be a number`).positive(`${label} must be greater than 0`).required(`${label} is required`);

const jobRequestSchema = Yup.object({
  "Job Title": requiredText("Job Title"),
  "Job ID": requiredText("Job ID"),
  Client: requiredText("Client"),
  "Company/Department": requiredText("Company/Department"),
  "Bill Rate": positiveNumber("Bill Rate"),
  "Pay Rate": positiveNumber("Pay Rate"),
  "Position Type": requiredText("Position Type"),
  "No of Vacancies": Yup.number().typeError("No of Vacancies must be a number").integer("No of Vacancies must be a whole number").min(1, "No of Vacancies must be at least 1").required("No of Vacancies is required"),
  City: requiredText("City"),
  Country: requiredText("Country"),
  "Experience Level": requiredText("Experience Level"),
  "Job Status": requiredText("Job Status"),
  "Business Unit": requiredText("Business Unit"),
  "Recruiter Assignment Status": requiredText("Recruiter Assignment Status"),
  "Job Description": requiredText("Job Description"),
});

const candidateSchema = Yup.object({
  "Job ID": requiredText("Job ID"),
  Name: requiredText("Name"),
  Email: Yup.string().trim().email("Enter a valid Email").required("Email is required"),
  Mobile: Yup.string().trim().matches(/^[0-9]{10}$/, "Mobile must be 10 digits").required("Mobile is required"),
  "Total Experience": requiredText("Total Experience"),
  "Relevant Experience": requiredText("Relevant Experience"),
  "Current CTC": requiredText("Current CTC"),
  "Expected CTC": requiredText("Expected CTC"),
  "Last Working Day (LWD)": requiredText("Last Working Day (LWD)"),
  "Skill Set": requiredText("Skill Set"),
  Gender: requiredText("Gender"),
  "Attach File": requiredText("Attach File"),
  "PIN Code": Yup.string().trim().matches(/^[0-9]{6}$/, "PIN Code must be 6 digits").required("PIN Code is required"),
  City: requiredText("City"),
  State: requiredText("State"),
  District: requiredText("District"),
});

const interviewSchema = Yup.object({
  Level: requiredText("Level"),
  "Type of Interview": requiredText("Type of Interview"),
  "Interview Date": requiredText("Interview Date"),
  time: requiredText("time"),
  Subject: requiredText("Subject"),
  "Start/End time": requiredText("Start/End time"),
  Participants: requiredText("Participants"),
  Others: requiredText("Others"),
});

const feedbackSchema = Yup.object({
  "Feedback Status": requiredText("Feedback Status"),
  "Feedback Comments": requiredText("Feedback Comments"),
});

const offerSchema = Yup.object({
  "Date of Joining": requiredText("Date of Joining"),
  "CTC Amount": requiredText("CTC Amount"),
  Basic: requiredText("Basic"),
  HRA: requiredText("HRA"),
  "Telephone/Internet Allowance": requiredText("Telephone/Internet Allowance"),
  "Special Allowance": requiredText("Special Allowance"),
  "Gross Salary": requiredText("Gross Salary"),
  "PF Contribution": requiredText("PF Contribution"),
  "Statutory Bonus": requiredText("Statutory Bonus"),
  Gratuity: requiredText("Gratuity"),
  ESI: requiredText("ESI"),
  "Cost to Company": requiredText("Cost to Company"),
  "CTC Amount in Words": requiredText("CTC Amount in Words"),
  Designation: requiredText("Designation"),
});

function emptyValues(fields)
{
  return fields.reduce((acc, field) =>
  {
    acc[field.name] = field.defaultValue || "";
    return acc;
  }, {});
}

function ValidatedForm({ fields, schema, columns = 4, submitLabel, secondaryLabel = "Cancel" })
{
  const [values, setValues] = useState(() => emptyValues(fields));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const update = (name, value) =>
  {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const submit = async (event) =>
  {
    event.preventDefault();
    try
    {
      await schema.validate(values, { abortEarly: false });
      setErrors({});
      setSubmitted(true);
    }
    catch (err)
    {
      const nextErrors = {};
      err.inner?.forEach((item) =>
      {
        if (item.path && !nextErrors[item.path]) nextErrors[item.path] = item.message;
      });
      setErrors(nextErrors);
      setSubmitted(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 15, padding: 15 }}>
        {fields.map((field) =>
        {
          const controlStyle = { ...inputStyle(), borderColor: errors[field.name] ? "#dc2626" : "#d1d5db" };
          return (
            <label key={field.name} style={{ gridColumn: field.full ? "1 / -1" : "auto", minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>{field.name}</div>
              {field.type === "select" ? (
                <select value={values[field.name]} onChange={(event) => update(field.name, event.target.value)} style={controlStyle}>
                  <option value="">Select {field.name}</option>
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === "textarea" ? (
                <textarea rows={field.rows || 4} value={values[field.name]} onChange={(event) => update(field.name, event.target.value)} placeholder={field.name} style={controlStyle} />
              ) : (
                <input type={field.type || "text"} value={values[field.name]} onChange={(event) => update(field.name, event.target.value)} placeholder={field.name} style={controlStyle} />
              )}
              {errors[field.name] && <div style={errorStyle()}>{errors[field.name]}</div>}
            </label>
          );
        })}
      </div>
      {submitted && <div style={{ padding: "0 15px 10px", color: "#166534", fontSize: 11, fontWeight: 700 }}>Validation passed.</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "0 14px 14px" }}>
        <Btn>{secondaryLabel}</Btn>
        <Btn primary type="submit">{submitLabel}</Btn>
      </div>
    </form>
  );
}

function FieldGrid({ fields, columns = 3, readOnly = false })
{
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 10, padding: 14 }}>
      {fields.map((field) => (
        <label key={field} style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>{field}</div>
          <input readOnly={readOnly} placeholder={field} style={inputStyle()} />
        </label>
      ))}
    </div>
  );
}

function RecruiterCheckboxList()
{
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {RECRUITERS.map((recruiter) => (
        <label key={recruiter.key} style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          border: "0.5px solid #d1d5db",
          borderRadius: 6,
          background: "#fff",
          fontSize: 11,
          fontWeight: 600,
          color: "#374151",
          cursor: "pointer",
        }}>
          <input type="checkbox" defaultChecked={recruiter.key === "Mike W."} />
          {recruiter.name}
        </label>
      ))}
    </div>
  );
}

function DataTable({ columns, rows })
{
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: Math.max(760, columns.length * 135) }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            {columns.map((column) => (
              <th key={column} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#6b7280", fontWeight: 700, borderBottom: "0.5px solid #e5e7eb", whiteSpace: "nowrap" }}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row["Job ID"] || row.Name || row.Candidate || index} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
              {columns.map((column) =>
              {
                const value = row[column] || "-";
                const isStatus = column.toLowerCase().includes("status") || column === "Job Status";
                return (
                  <td key={column} style={{ padding: "8px 12px", fontSize: 11, color: "#374151", whiteSpace: "nowrap" }}>
                    {isStatus ? <Badge color={badgeColor(value)}>{value}</Badge> : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Toolbar({ role, setActive })
{
  if (role.id === 1) return null;
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {role.id === 4 && <Btn onClick={() => setActive("requirements")}><Filter size={13} /> Filter</Btn>}
      {role.id === 4 && <Btn primary onClick={() => setActive("requirements")}><Plus size={14} /> New Job Request</Btn>}
      {role.id === 5 && <Btn primary onClick={() => setActive("candidates")}><UserPlus size={14} /> Add Candidate Details</Btn>}
    </div>
  );
}

function AdminDashboard()
{
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        <Stat icon={Briefcase} label="Open Requirements" value="12" note="HR Manager owns action" />
        <Stat icon={CalendarCheck} label="Interviews Today" value="8" note="Recruiter scheduled" color="#6366f1" />
        <Stat icon={FileCheck} label="Pending Offers" value="4" note="Approval / release watch" color="#10b981" />
        <Stat icon={BarChart3} label="Onboarded" value="10" note="This month" color="#7c3aed" />
      </div>
      <Card title="Admin Tracking View">
        <DataTable
          columns={["Metric", "Current", "Owner", "Status"]}
          rows={[
            { Metric: "Job Request Creation", Current: "5 new", Owner: "HR / Recruiter Manager", Status: "Active" },
            { Metric: "Candidate Sourcing", Current: "18 profiles", Owner: "Recruiter", Status: "Work in Progress" },
            { Metric: "Offer Release", Current: "4 pending", Owner: "HR / Recruiter Manager", Status: "In Progress" },
            { Metric: "Onboarding Completion", Current: "10 completed", Owner: "HR / Recruiter Manager", Status: "Onboarded" },
          ]}
        />
      </Card>
      <Card title="System Status Reference">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 14 }}>
          {STATUS_REFERENCE.map((status) => <Badge key={status} color={badgeColor(status)}>{status}</Badge>)}
        </div>
      </Card>
    </>
  );
}

function ManagerDashboard()
{
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        <Stat icon={Briefcase} label="Job Requests" value="9" note="Create and assign" color={COLORS.manager} />
        <Stat icon={Users} label="Team Candidates" value="54" note="Recruiter-wise" />
        <Stat icon={FileCheck} label="Offers" value="3" note="Release pending" color="#10b981" />
        <Stat icon={CheckCircle} label="Onboarding" value="6" note="Verify forms" color="#6366f1" />
      </div>
      <Card title="Assign Job/List Jobs" action={<RecruiterCheckboxList />}>
        <DataTable columns={["Job ID", "Job Title", "Client", "Select Recruiter", "My Tasks", "Status"]} rows={JOB_REQUESTS} />
      </Card>
    </>
  );
}

function RecruiterDashboard({ recruiterKey })
{
  const myJobs = JOB_REQUESTS.filter((job) => job["Select Recruiter"] === recruiterKey);
  const myCandidates = CANDIDATES.filter((candidate) => candidate.Recruiter === recruiterKey);
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        <Stat icon={Briefcase} label="My Tasks" value={myJobs.length} note="Work in Progress" />
        <Stat icon={Users} label="My Candidates" value={myCandidates.length} note="Profiles uploaded" color="#6366f1" />
        <Stat icon={CalendarCheck} label="Schedule Interview" value="2" note="Today" color="#10b981" />
        <Stat icon={FileCheck} label="Feedback Pending" value="1" note="Submit feedback" color="#ef4444" />
      </div>
      <Card title="My Tasks">
        <DataTable columns={["Job ID", "Job Title", "Client", "My Tasks", "Status"]} rows={myJobs} />
      </Card>
    </>
  );
}

function RequirementsTab({ role, recruiterKey })
{
  if (role.id === 5)
  {
    const myJobs = JOB_REQUESTS.filter((job) => job["Select Recruiter"] === recruiterKey);
    return (
      <Card title="My Tasks">
        <DataTable columns={["Job ID", "Job Title", "Client", "My Tasks", "Status"]} rows={myJobs} />
      </Card>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 180px", gap: 8, marginBottom: 14 }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "#9ca3af" }} />
          <input readOnly placeholder="Search Job Title / Job ID / Client" style={{ ...inputStyle(), paddingLeft: 32 }} />
        </div>
        <select disabled style={inputStyle()}><option>Job Status</option><option>Active</option><option>In Active</option></select>
        <select disabled style={inputStyle()}><option>Recruiter Assignment Status</option><option>Open</option><option>Closed</option><option>Completed</option><option>Hold</option></select>
      </div>
      <Card title="New Job Request">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 15,
            padding: 15,
          }}
        >

          <div>
            <label>Job Title</label>
            <input style={inputStyle()} />
          </div>

          <div>
            <label>Job ID</label>
            <input style={inputStyle()} />
          </div>

          <div>
            <label>Client</label>
            <input style={inputStyle()} />
          </div>

          <div>
            <label>Company/Department</label>
            <input style={inputStyle()} />
          </div>

          <div>
            <label>Bill Rate</label>
            <input type="number" style={inputStyle()} />
          </div>

          <div>
            <label>Pay Rate</label>
            <input type="number" style={inputStyle()} />
          </div>

          {/* Dropdown */}
          <div>
            <label>Position Type</label>
            <select style={inputStyle()}>
              <option>Contract</option>
              <option>Permanent</option>
              <option>Contract to Hire</option>
              <option>Direct Hire</option>
            </select>
          </div>

          <div>
            <label>No of Vacancies</label>
            <input type="number" style={inputStyle()} />
          </div>

          <div>
            <label>City</label>
            <input style={inputStyle()} />
          </div>

          <div>
            <label>Country</label>
            <input style={inputStyle()} />
          </div>

          <div>
            <label>Experience Level</label>
            <input style={inputStyle()} />
          </div>

          {/* Dropdown */}
          <div>
            <label>Job Status</label>
            <select style={inputStyle()}>
              <option>Active</option>
              <option>Inactive</option>
              <option>Hold</option>
              <option>Closed</option>
            </select>
          </div>

          <div>
            <label>Business Unit</label>
            <input style={inputStyle()} />
          </div>

          {/* Dropdown */}
          <div>
            <label>Recruiter Assignment Status</label>
            <select style={inputStyle()}>
              <option>Open</option>
              <option>Assigned</option>
              <option>Completed</option>
              <option>Hold</option>
            </select>
          </div>

          {/* Textarea */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Job Description</label>
            <textarea rows={5} style={inputStyle()} />
          </div>

        </div>
        {/* <FieldGrid fields={["Job Title", "Job ID", "Client", "Company/Department", "Bill Rate", "Pay Rate", "Position Type", "Job Status", "Business Unit", "Recruiter Assignment Status", "Job Description"]} /> */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "0 14px 14px" }}>
          <Btn>Cancel</Btn>
          <Btn primary>Submit Job Requirement</Btn>
        </div>
      </Card>
      <Card title="Assign Job/List Jobs" action={<RecruiterCheckboxList />}>
        <DataTable columns={["Job ID", "Job Title", "Client", "Company/Department", "Position Type", "Job Status", "Business Unit", "Recruiter Assignment Status", "Select Recruiter", "My Tasks", "Status"]} rows={JOB_REQUESTS} />
      </Card>
    </>
  );
}

function CandidatesTab({
  role,
  recruiterKey,
  setSelectedCandidate,
  setActive,
})
{
  const rows =
    role.id === 5
      ? CANDIDATES.filter(
        (candidate) => candidate.Recruiter === recruiterKey
      )
      : CANDIDATES;

  const tableRows = rows.map((row) => ({
    ...row,
    Action: (
      <Btn
        primary
        small
        onClick={() =>
        {
          setSelectedCandidate(row);
          setActive("interviews");
        }}
      >
        Schedule Interview
      </Btn>
    ),
  }));

  return (
    <>
      {role.id === 5 && (
        <Card title="Add Candidate Details">
          <FieldGrid
            fields={[
              "Job ID",
              "Name",
              "Email",
              "Mobile",
              "Total Experience",
              "Relevant Experience",
              "Current CTC",
              "Expected CTC",
              "Last Working Day (LWD)",
              "Skill Set",
              "Gender",
              "Attach File",
              "PIN Code",
              "City",
              "State",
              "District",
            ]}
            columns={4}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              padding: "0 14px 14px",
            }}
          >
            <Btn>Cancel</Btn>
            <Btn primary>Submit Candidate Info</Btn>
          </div>
        </Card>
      )}

      <Card
        title={
          role.id === 5
            ? "My Candidates"
            : "Recruiter-wise Candidates"
        }
      >
        <DataTable
          columns={[
            "Job ID",
            "Name",
            "Email",
            "Mobile",
            "Total Experience",
            "Relevant Experience",
            "Current CTC",
            "Expected CTC",
            "Last Working Day (LWD)",
            "Skill Set",
            "Gender",
            "Attach File",
            "PIN Code",
            "City",
            "State",
            "District",
            "Status",
            "Action",
          ]}
          rows={tableRows}
        />
      </Card>
    </>
  );
}

function InterviewsTab({
  role,
  recruiterKey,
  selectedCandidate,
  handleScheduleInterview,
  interviews,
})
{

  const rows =
    role.id === 5
      ? interviews.filter(
        (i) => i.Recruiter === recruiterKey
      )
      : interviews;

  return (
    <>
      {role.id === 5 && (
        <Card title="Schedule Interview">

          <ScheduleInterview
            candidate={selectedCandidate}
            onSave={handleScheduleInterview}
          />

        </Card>
      )}

      <Card title="Interview History / Feedback">
        <DataTable
          columns={[
            "Candidate",
            "Level",
            "Type of Interview",
            "Interview Date",
            "time",
            "Subject",
            "Start/End time",
            "Participants",
            "Others",
            "Feedback Status",
            "Feedback Comments",
          ]}
          rows={rows}
        />
      </Card>

      {role.id === 5 && (
        <Card title="Submit Feedback">
          <InterviewFeedback />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              padding: "0 14px 14px",
            }}
          >
            <Btn>Save and Conduct Next Round</Btn>
            <Btn primary>Shortlist the Candidate</Btn>
          </div>
        </Card>
      )}
    </>
  );
}


function OffersTab()
{
  return (
    <>
      <Card title="Release Offer">
        <FieldGrid fields={["Date of Joining", "CTC Amount", "Basic", "HRA", "Telephone/Internet Allowance", "Special Allowance", "Gross Salary", "PF Contribution", "Statutory Bonus", "Gratuity", "ESI", "Cost to Company", "CTC Amount in Words", "Designation"]} columns={4} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "0 14px 14px" }}>
          <Btn>Save Structure</Btn>
          <Btn primary>Release</Btn>
        </div>
      </Card>
      <Card title="Offer & Onboarding">
        <DataTable columns={["Candidate", "Date of Joining", "CTC Amount", "Basic", "HRA", "Telephone/Internet Allowance", "Special Allowance", "Gross Salary", "PF Contribution", "Statutory Bonus", "Gratuity", "ESI", "Cost to Company", "CTC Amount in Words", "Designation", "Status"]} rows={OFFER_ROWS} />
      </Card>
      <Card title="Finalizing Onboarding">
        <DataTable columns={["Candidate", "Current Status of Employee", "Effective Date", "Onboard", "Review Forms Submitted"]} rows={ONBOARDING_ROWS} />
      </Card>
    </>
  );
}

function ReportsTab()
{
  return (
    <Card title="Reports">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: 14 }}>
        {["Recruitment Report", "Candidate Status Report", "Offer Report", "Joining Report", "Recruiter Performance", "Department Hiring Report"].map((item) => (
          <div key={item} style={{ border: "0.5px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#111827" }}>
              <BarChart3 size={15} color="#f18200" />
              {item}
            </div>
            <p style={{ margin: "6px 0 10px", fontSize: 11, color: "#6b7280" }}>Download and audit role-wise onboarding data.</p>
            <Btn small>Download</Btn>
          </div>
        ))}
      </div>
    </Card>
  );
}

const TABS = {
  1: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "reports", label: "Reports", icon: BarChart3 },
  ],
  4: [
    { key: "dashboard", label: "HR Manager Dashboard", icon: LayoutDashboard },
    { key: "requirements", label: "Job Requests", icon: Briefcase },
    { key: "candidates", label: "Candidates", icon: Users },
    { key: "interviews", label: "Interviews", icon: CalendarCheck },
    { key: "offers", label: "Offer & Onboarding", icon: FileCheck },
  ],
  5: [
    { key: "dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { key: "requirements", label: "My Tasks", icon: Briefcase },
    { key: "candidates", label: "Add Candidate", icon: Users },
    { key: "interviews", label: "Interviews", icon: CalendarCheck },
  ],
};

export default function Recruitment()
{
  const user = getStoredUser();
  const role = roleInfo(user);
  const tabs = TABS[role.id];
  const [active, setActive] = useState("dashboard");
  const recruiterKey = getRecruiterKey(user);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [interviews, setInterviews] = useState(INTERVIEWS);

  const handleScheduleInterview = (interview) =>
  {

    setInterviews((prev) => [...prev, interview]);

    setActive("interviews");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "20px 24px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#111827" }}>Recruitment / Employee Onboarding</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge color={role.id === 1 ? "gray" : role.id === 4 ? "purple" : "orange"}>{role.label}</Badge>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{user?.name || ""}</span>
          </div>
        </div>
        <Toolbar role={role} setActive={setActive} />
      </header>

      <nav style={{ display: "flex", gap: 2, overflowX: "auto", background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 4, marginBottom: 18 }}>
        {tabs.map((tab) =>
        {
          const Icon = tab.icon;
          const selected = active === tab.key;
          return (
            <button key={tab.key} onClick={() => setActive(tab.key)} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              borderRadius: 7,
              padding: "7px 14px",
              whiteSpace: "nowrap",
              cursor: "pointer",
              background: selected ? role.color : "transparent",
              color: selected ? "#fff" : "#6b7280",
              fontSize: 12,
              fontWeight: selected ? 700 : 500,
            }}>
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {active === "dashboard" && role.id === 1 && <AdminDashboard />}
      {active === "dashboard" && role.id === 4 && <ManagerDashboard />}
      {active === "dashboard" && role.id === 5 && <RecruiterDashboard recruiterKey={recruiterKey} />}
      {active === "requirements" && <RequirementsTab role={role} recruiterKey={recruiterKey} />}
      {active === "candidates" && <CandidatesTab
        role={role}
        recruiterKey={recruiterKey}
        setSelectedCandidate={setSelectedCandidate}
        setActive={setActive}
      />}
      {active === "interviews" && <InterviewsTab
        role={role}
        recruiterKey={recruiterKey}
        selectedCandidate={selectedCandidate}
        handleScheduleInterview={handleScheduleInterview}
        interviews={interviews}
      />}
      {active === "offers" && role.id === 4 && <OffersTab />}
      {active === "reports" && role.id === 1 && <ReportsTab />}
    </div>
  );
}
