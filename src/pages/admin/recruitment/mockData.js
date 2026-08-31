

export const POSITION_TYPES = ['Contract', 'Contract to Hire', 'Direct Hire'];
export const BUSINESS_UNITS = ['Nat IT', 'Natsoft'];
export const ASSIGNMENT_STATUSES = ['Open', 'Closed', 'Completed', 'Hold'];
export const JOB_STATUSES = ['Active', 'In Active'];
export const INTERVIEW_LEVELS = ['Round 1', 'Round 2', 'Round 3', 'HR', 'Final'];
export const INTERVIEW_TYPES = ['Video Call', 'Phone', 'In-Person', 'Teams', 'GoogleMeet', 'Zoom'];
export const FEEDBACK_STATUSES = ['Shortlist', 'Move to Next Round', 'Reject / Drop'];
export const GENDERS = ['Male', 'Female', 'Other'];

export const CANDIDATE_STATUSES = {
  'Work in Progress': { color: '#1d4ed8', bg: '#dbeafe', label: 'Work in Progress' },
  'Schedule Interview': { color: '#7c3aed', bg: '#ede9fe', label: 'Schedule Interview' },
  'Shortlisted': { color: '#0369a1', bg: '#e0f2fe', label: 'Shortlisted' },
  'Offer Released': { color: '#d97706', bg: '#fef3c7', label: 'Offer Released' },
  'Offer Accepted': { color: '#059669', bg: '#d1fae5', label: 'Offer Accepted' },
  'Offer Rejected': { color: '#dc2626', bg: '#fee2e2', label: 'Offer Rejected' },
  'Interview Scheduled': { color: '#6d28d9', bg: '#ede9fe', label: 'Interview Scheduled' },
  'Rejected': { color: '#dc2626', bg: '#fee2e2', label: 'Rejected' },
  'Joining Formalities': { color: '#0891b2', bg: '#cffafe', label: 'Joining Formalities' },
  'Onboarded': { color: '#166534', bg: '#dcfce7', label: 'Onboarded' }
};

export const MOCK_RECRUITERS = [
{ id: 21, name: 'Sarah Johnson', email: 'teamlead@yopmail.com', role: 'Team Lead' },
{ id: 22, name: 'Mike Williams', email: 'recruiter1@yopmail.com', role: 'Recruiter' },
{ id: 23, name: 'Emily Chen', email: 'recruiter2@yopmail.com', role: 'Recruiter' }];


export const MOCK_JOBS = [
{
  id: 'JOB001', title: 'Java Developer', client: 'ABC Ltd', company: 'Nat IT',
  billRate: 65, payRate: 50, positionType: 'Contract', jobStatus: 'Active',
  businessUnit: 'Nat IT', assignmentStatus: 'Open', openings: 3,
  description: 'Looking for an experienced Java Developer with Spring Boot, Microservices, and MySQL expertise. Must have 4+ years of hands-on development experience.',
  skills: ['Java', 'Spring Boot', 'MySQL', 'Microservices'],
  assignedRecruiters: [22], createdDate: '2026-06-01', totalCandidates: 4
},
{
  id: 'JOB002', title: 'React Developer', client: 'XYZ Corp', company: 'Natsoft',
  billRate: 75, payRate: 58, positionType: 'Contract to Hire', jobStatus: 'Active',
  businessUnit: 'Natsoft', assignmentStatus: 'Open', openings: 2,
  description: 'React.js developer with experience in Redux, TypeScript, and REST API integration. Remote-friendly role with client-facing responsibilities.',
  skills: ['React', 'Redux', 'TypeScript', 'REST APIs'],
  assignedRecruiters: [22, 23], createdDate: '2026-06-05', totalCandidates: 3
},
{
  id: 'JOB003', title: 'QA Engineer', client: 'Tech Solutions', company: 'Nat IT',
  billRate: 55, payRate: 42, positionType: 'Direct Hire', jobStatus: 'Active',
  businessUnit: 'Nat IT', assignmentStatus: 'Open', openings: 2,
  description: 'Manual and Automation QA with Selenium, TestNG, and JIRA experience. Financial domain preferred.',
  skills: ['Selenium', 'TestNG', 'JIRA', 'SQL'],
  assignedRecruiters: [23], createdDate: '2026-06-08', totalCandidates: 2
},
{
  id: 'JOB004', title: '.NET Developer', client: 'Innovate Ltd', company: 'Nat IT',
  billRate: 70, payRate: 55, positionType: 'Contract', jobStatus: 'Active',
  businessUnit: 'Nat IT', assignmentStatus: 'Completed', openings: 1,
  description: '.NET / C# developer with Azure cloud and WPF experience. Strong communication skills required.',
  skills: ['.NET', 'C#', 'Azure', 'WPF'],
  assignedRecruiters: [22], createdDate: '2026-06-10', totalCandidates: 5
},
{
  id: 'JOB005', title: 'UI/UX Designer', client: 'Pixel Pvt Ltd', company: 'Natsoft',
  billRate: 60, payRate: 45, positionType: 'Direct Hire', jobStatus: 'In Active',
  businessUnit: 'Natsoft', assignmentStatus: 'Hold', openings: 1,
  description: 'UI/UX Designer with Figma, Adobe XD, and user research experience.',
  skills: ['Figma', 'Adobe XD', 'Prototyping'],
  assignedRecruiters: [], createdDate: '2026-06-12', totalCandidates: 1
}];


export const MOCK_CANDIDATES = [
{
  id: 'CAN001', jobId: 'JOB001', recruiterId: 22,
  name: 'John Doe', email: 'john.doe@gmail.com', mobile: '9876543210',
  totalExp: 5, relevantExp: 4, currentCTC: 600000, expectedCTC: 900000,
  noticePeriod: true, lwd: '2026-07-31',
  skills: ['Java', 'Spring Boot', 'MySQL', 'Microservices'],
  gender: 'Male', pinCode: '500081', city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad',
  status: 'Shortlisted', source: 'Naukri.com', resumeFile: 'john_doe_resume.pdf',
  addedDate: '2026-06-10'
},
{
  id: 'CAN002', jobId: 'JOB001', recruiterId: 22,
  name: 'Jane Smith', email: 'jane.smith@gmail.com', mobile: '9876543211',
  totalExp: 4, relevantExp: 3.5, currentCTC: 550000, expectedCTC: 750000,
  noticePeriod: false, lwd: null,
  skills: ['Java', 'Hibernate', 'REST APIs'],
  gender: 'Female', pinCode: '560001', city: 'Bangalore', state: 'Karnataka', district: 'Bengaluru Urban',
  status: 'Schedule Interview', source: 'LinkedIn', resumeFile: 'jane_smith_resume.pdf',
  addedDate: '2026-06-12'
},
{
  id: 'CAN003', jobId: 'JOB002', recruiterId: 23,
  name: 'Mike Johnson', email: 'mike.j@gmail.com', mobile: '9876543212',
  totalExp: 3, relevantExp: 3, currentCTC: 480000, expectedCTC: 700000,
  noticePeriod: true, lwd: '2026-07-15',
  skills: ['React', 'Redux', 'TypeScript'],
  gender: 'Male', pinCode: '400001', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai City',
  status: 'Work in Progress', source: 'Referral', resumeFile: 'mike_j_resume.pdf',
  addedDate: '2026-06-14'
},
{
  id: 'CAN004', jobId: 'JOB002', recruiterId: 22,
  name: 'Emily Davis', email: 'emily.d@gmail.com', mobile: '9876543213',
  totalExp: 6, relevantExp: 5, currentCTC: 800000, expectedCTC: 1100000,
  noticePeriod: false, lwd: null,
  skills: ['React', 'Node.js', 'MongoDB', 'AWS'],
  gender: 'Female', pinCode: '600001', city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai',
  status: 'Offer Accepted', source: 'Indeed', resumeFile: 'emily_d_resume.pdf',
  addedDate: '2026-06-08'
},
{
  id: 'CAN005', jobId: 'JOB003', recruiterId: 23,
  name: 'David Wilson', email: 'david.w@gmail.com', mobile: '9876543214',
  totalExp: 4, relevantExp: 3, currentCTC: 500000, expectedCTC: 720000,
  noticePeriod: true, lwd: '2026-08-01',
  skills: ['Selenium', 'TestNG', 'Java', 'JIRA'],
  gender: 'Male', pinCode: '411001', city: 'Pune', state: 'Maharashtra', district: 'Pune',
  status: 'Schedule Interview', source: 'Naukri.com', resumeFile: 'david_w_resume.pdf',
  addedDate: '2026-06-16'
},
{
  id: 'CAN006', jobId: 'JOB004', recruiterId: 22,
  name: 'Priya Sharma', email: 'priya.s@gmail.com', mobile: '9876543215',
  totalExp: 7, relevantExp: 6, currentCTC: 950000, expectedCTC: 1200000,
  noticePeriod: false, lwd: null,
  skills: ['.NET', 'C#', 'Azure', 'SQL Server'],
  gender: 'Female', pinCode: '110001', city: 'Delhi', state: 'Delhi', district: 'New Delhi',
  status: 'Onboarded', source: 'LinkedIn', resumeFile: 'priya_s_resume.pdf',
  addedDate: '2026-05-20'
}];


export const MOCK_INTERVIEWS = [
{
  id: 'INT001', candidateId: 'CAN001', jobId: 'JOB001',
  level: 'Level 1', type: 'OnCall',
  date: '2026-06-20', time: '10:00',
  interviewer: 'Alex Thompson',
  status: 'Completed',
  feedbackStatus: 'Selected', feedbackComments: 'Strong Java fundamentals. Good communication.',
  shortlisted: true
},
{
  id: 'INT002', candidateId: 'CAN001', jobId: 'JOB001',
  level: 'Level 2', type: 'Microsoft Teams',
  date: '2026-06-25', time: '11:30',
  interviewer: 'Sarah Johnson',
  teamsSubject: 'L2 Technical Round - John Doe',
  teamsParticipants: 'sarah.johnson@natit.com, alex.t@natit.com',
  status: 'Completed',
  feedbackStatus: 'Selected', feedbackComments: 'Excellent system design skills. Highly recommended.',
  shortlisted: true
},
{
  id: 'INT003', candidateId: 'CAN002', jobId: 'JOB001',
  level: 'Level 1', type: 'OnCall',
  date: '2026-07-02', time: '14:00',
  interviewer: 'Mike Williams',
  status: 'Scheduled',
  feedbackStatus: null, feedbackComments: '',
  shortlisted: false
},
{
  id: 'INT004', candidateId: 'CAN005', jobId: 'JOB003',
  level: 'Level 1', type: 'OnCall',
  date: '2026-07-03', time: '15:00',
  interviewer: 'Emily Chen',
  status: 'Scheduled',
  feedbackStatus: null, feedbackComments: '',
  shortlisted: false
}];


export const MOCK_OFFERS = [
{
  id: 'OFF001', candidateId: 'CAN001', jobId: 'JOB001',
  dateOfJoining: '2026-08-01',
  ctcAmount: 900000,
  basic: 450000, hra: 180000, telephone: 12000, specialAllowance: 108000,
  grossSalary: 750000, pfContribution: 54000, statutoryBonus: 46250,
  gratuity: 43269, esi: 0, costToCompany: 900000,
  ctcInWords: 'Nine Lakh Rupees Only',
  designation: 'Senior Java Developer',
  approvalStatus: 'Approved', approvedBy: 'HR Head',
  offerStatus: 'Offer Accepted',
  sentDate: '2026-06-28', respondedDate: '2026-06-29'
},
{
  id: 'OFF002', candidateId: 'CAN004', jobId: 'JOB002',
  dateOfJoining: '2026-07-15',
  ctcAmount: 1100000,
  basic: 550000, hra: 220000, telephone: 12000, specialAllowance: 118000,
  grossSalary: 900000, pfContribution: 66000, statutoryBonus: 46250,
  gratuity: 52884, esi: 0, costToCompany: 1100000,
  ctcInWords: 'Eleven Lakh Rupees Only',
  designation: 'Senior React Developer',
  approvalStatus: 'Approved', approvedBy: 'HR Head',
  offerStatus: 'Offer Accepted',
  sentDate: '2026-06-15', respondedDate: '2026-06-16'
}];


export const MOCK_ONBOARDING = [
{
  id: 'ONB001', candidateId: 'CAN004', offerId: 'OFF002',
  employeeInfoSubmitted: true, photoUploaded: true,
  joiningFormalities: 'Completed',
  teamLifeInsurance: 'Completed',
  gratuityNomination: 'Completed',
  insuranceNomination: 'In Progress',
  pfDeclaration: 'Pending',
  hrVerified: false, effectiveDate: '2026-07-15',
  status: 'In Progress'
},
{
  id: 'ONB002', candidateId: 'CAN006', offerId: null,
  employeeInfoSubmitted: true, photoUploaded: true,
  joiningFormalities: 'Completed',
  teamLifeInsurance: 'Completed',
  gratuityNomination: 'Completed',
  insuranceNomination: 'Completed',
  pfDeclaration: 'Completed',
  hrVerified: true, effectiveDate: '2026-05-01',
  status: 'Onboarded'
}];


export function getCandidateName(id) {
  return MOCK_CANDIDATES.find((c) => c.id === id)?.name || id;
}
export function getJobTitle(id) {
  return MOCK_JOBS.find((j) => j.id === id)?.title || id;
}
export function getRecruiterName(id) {
  return MOCK_RECRUITERS.find((r) => r.id === id)?.name || 'Unassigned';
}
export function formatCTC(amount) {
  if (!amount) return '—';
  return `₹${(amount / 100000).toFixed(1)} LPA`;
}
export function formatCurrency(amount) {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
