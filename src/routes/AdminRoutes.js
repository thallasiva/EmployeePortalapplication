import React, { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredUser } from "../data/auth";
import LazyPage from "./LazyPage";
import MenuPermissionGuard from "./MenuPermissionGuard";
const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const Employee = lazy(() => import("../pages/admin/Employee"));
const EmployeeDetail = lazy(() => import("../pages/admin/EmployeeDetail"));
const CreateEmployee = lazy(() => import("../pages/admin/CreateEmployee"));
const Company = lazy(() => import("../pages/admin/Company"));
const Offices = lazy(() => import("../pages/admin/Offices"));
const CreateCompany = lazy(() => import("../pages/admin/CreateCompany"));
const CalendarForm = lazy(() => import("../pages/admin/CalendarForm"));
const AdminCalendar = lazy(() => import("../pages/admin/Calendar"));
const Leave = lazy(() => import("../pages/admin/AdminLeaveManagement"));
const AttendanceModuleLayout = lazy(() => import("../pages/admin/attendance/AttendanceModuleLayout"));
const AttendanceDashboard = lazy(() => import("../pages/admin/attendance/AttendanceDashboard"));
const AttendanceRecords = lazy(() => import("../pages/admin/attendance/AttendanceRecords"));
const AttendanceShiftManagement = lazy(() => import("../pages/admin/attendance/AttendanceShiftManagement"));
const AttendanceCorrections = lazy(() => import("../pages/admin/attendance/AttendanceCorrections"));
const GeoFenceLocations = lazy(() => import("../pages/admin/attendance/GeoFenceLocations"));
const OvertimeManagement = lazy(() => import("../pages/admin/attendance/OvertimeManagement"));
const AttendanceReports = lazy(() => import("../pages/admin/attendance/AttendanceReports"));
const AdminDocuments = lazy(() => import("../pages/admin/AdminDocuments"));
const AddDocumentScreen = lazy(() => import("../pages/admin/AddDocumentScreen"));
const Reports = lazy(() => import("../pages/admin/Report"));
const AdminPayrollOverview = lazy(() => import("../pages/admin/AdminPayrollOverview"));
const PayRollForm = lazy(() => import("../pages/admin/PayRollForm"));
const AdminPayslips = lazy(() => import("../pages/admin/AdminPayslips"));
const AdminPerformanceRollout = lazy(() => import("../pages/admin/AdminPerformanceRollout"));
const AdminKudosFeedback = lazy(() => import("../pages/admin/kudosFeedback/AdminKudosFeedback"));
const AdminSalaryProcessing = lazy(() => import("../pages/admin/salaryProcessing/AdminSalaryProcessing"));
const AdminITDeclaration = lazy(() => import("../pages/admin/AdminITDeclaration"));
const AdminResignations = lazy(() => import("../pages/admin/AdminResignations"));
const AdminTimesheets = lazy(() => import("../pages/admin/AdminTimesheets"));
const Onboarding = lazy(() => import("../pages/admin/Onboarding"));
const Manage = lazy(() => import("../pages/admin/Manage"));
const ManagePermissions = lazy(() => import("../pages/admin/ManagePermissions"));
const Settings = lazy(() => import("../pages/admin/Settings"));
const EmailConfiguration = lazy(() => import("../pages/admin/settings/EmailConfiguration"));
const NotificationSettings = lazy(() => import("../pages/admin/settings/NotificationSettings"));
const AuditLogs = lazy(() => import("../pages/admin/settings/AuditLogs"));
const NotificationCenter = lazy(() => import("../pages/admin/NotificationCenter"));
const FormBuilder = lazy(() => import("../pages/admin/FormBuilder"));
const DashboardBuilder = lazy(() => import("../pages/admin/DashboardBuilder"));
const MenuPermissionBuilder = lazy(() => import("../pages/admin/MenuPermissionBuilder"));
const ReportBuilder = lazy(() => import("../pages/admin/ReportBuilder"));
const Profile = lazy(() => import("../pages/admin/Profile"));
const MfaSetup = lazy(() => import("../pages/admin/MfaSetup"));
const LeaveSummaryReport = lazy(() => import("../pages/admin/LeaveSummaryReport"));
const HelpdeskAdmin = lazy(() => import("../pages/admin/helpdesk/HelpdeskAdmin"));
const AdminPayrollStatement = lazy(() => import("../pages/admin/AdminPayrollStatement"));
const AdminPayrollYTD = lazy(() => import("../pages/admin/AdminPayrollYTD"));
const AdminPayrollInputs = lazy(() => import("../pages/admin/AdminPayrollInputs"));
const AdminPayrollCompliance = lazy(() => import("../pages/admin/AdminPayrollCompliance"));
const AdminPayrollTaxForms = lazy(() => import("../pages/admin/AdminPayrollTaxForms"));
const AdminPayrollSetup = lazy(() => import("../pages/admin/AdminPayrollSetup"));
const AdminWorkflowDelegation = lazy(() => import("../pages/admin/AdminWorkflowDelegation"));
const Recruitment = lazy(() => import("../pages/admin/Recruitment"));
const CreateJobPage = lazy(() => import("../pages/admin/recruitment/CreateJobPage"));
const RoleManagement      = lazy(() => import("../pages/admin/RoleManagement"));
const SalaryTemplates     = lazy(() => import("../pages/admin/SalaryTemplates"));
const SalaryComponents    = lazy(() => import("../pages/admin/SalaryComponents"));
const SalaryStructures    = lazy(() => import("../pages/admin/SalaryStructures"));
const SalaryAssignments      = lazy(() => import("../pages/admin/SalaryAssignments"));
const SalaryStructureEditor  = lazy(() => import("../pages/admin/SalaryStructureEditor"));
const TrainingManagement = lazy(() => import("../pages/admin/TrainingManagement"));
const ShiftManagement = lazy(() => import("../pages/admin/ShiftManagement"));
const AssetManagement = lazy(() => import("../pages/admin/AssetManagement"));
const ApprovalsInbox = lazy(() => import("../pages/admin/ApprovalsInbox"));
const AssetModuleLayout = lazy(() => import("../pages/admin/assetManagement/AssetModuleLayout"));
const AssetInventory = lazy(() => import("../pages/admin/assetManagement/AssetWorkflowScreens").then((module) => ({ default: module.AssetInventory })));
const AssetCategories = lazy(() => import("../pages/admin/assetManagement/AssetWorkflowScreens").then((module) => ({ default: module.AssetCategories })));
const AssetAllocation = lazy(() => import("../pages/admin/assetManagement/AssetWorkflowScreens").then((module) => ({ default: module.AssetAllocation })));
const AssetRequests = lazy(() => import("../pages/admin/assetManagement/AssetWorkflowScreens").then((module) => ({ default: module.AssetRequests })));
const AssetReturns = lazy(() => import("../pages/admin/assetManagement/AssetWorkflowScreens").then((module) => ({ default: module.AssetReturns })));
const AssetMaintenance = lazy(() => import("../pages/admin/assetManagement/AssetWorkflowScreens").then((module) => ({ default: module.AssetMaintenance })));
const AssetTransfers = lazy(() => import("../pages/admin/assetManagement/AssetWorkflowScreens").then((module) => ({ default: module.AssetTransfers })));
const AssetReports = lazy(() => import("../pages/admin/assetManagement/AssetWorkflowScreens").then((module) => ({ default: module.AssetReports })));
const Page = LazyPage;
const AdminRoutes = () =>
{
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <MenuPermissionGuard>
    <Routes>
      <Route index element={<Page><Dashboard /></Page>} />
      <Route path="employee" element={<Page><Employee /></Page>} />
      <Route path="employee/:id" element={<Page><EmployeeDetail /></Page>} />
      <Route path="create-employee" element={<Page><CreateEmployee /></Page>} />
      <Route path="company" element={<Page><Company /></Page>} />
      <Route path="offices" element={<Page><Offices /></Page>} />
      <Route path="create-company" element={<Page><CreateCompany /></Page>} />
      <Route path="calendar" element={<Page><AdminCalendar /></Page>} />
      <Route path="calendar/form" element={<Page><CalendarForm /></Page>} />
      <Route path="leave" element={<Page><Leave /></Page>} />
      <Route path="attendance/*" element={<Page><AttendanceModuleLayout /></Page>}>
        <Route index element={<Page><AttendanceDashboard /></Page>} />
        <Route path="records" element={<Page><AttendanceRecords /></Page>} />
        <Route path="shifts" element={<Page><AttendanceShiftManagement /></Page>} />
        <Route path="corrections" element={<Page><AttendanceCorrections /></Page>} />
        <Route path="locations" element={<Page><GeoFenceLocations /></Page>} />
        <Route path="overtime" element={<Page><OvertimeManagement /></Page>} />
        <Route path="reports" element={<Page><AttendanceReports /></Page>} />
      </Route>
      <Route path="documents" element={<Page><AdminDocuments /></Page>} />
      <Route path="add-document" element={<Page><AddDocumentScreen /></Page>} />
      <Route path="payroll" element={<Page><AdminPayrollOverview /></Page>} />
      <Route path="payroll/salary" element={<Page><PayRollForm /></Page>} />
      <Route path="payroll/payslips" element={<Page><AdminPayslips /></Page>} />
      <Route path="payroll/process" element={<Page><AdminSalaryProcessing /></Page>} />
      <Route path="performance" element={<Page><AdminPerformanceRollout /></Page>} />
      <Route path="kudos-feedback" element={<Page><AdminKudosFeedback /></Page>} />
      <Route path="it-declaration" element={<Page><AdminITDeclaration /></Page>} />
      <Route path="resignations" element={<Page><AdminResignations /></Page>} />
      <Route path="timesheets" element={<Page><AdminTimesheets /></Page>} />
      <Route path="training" element={<Page><TrainingManagement /></Page>} />
      <Route path="shifts" element={<Page><ShiftManagement /></Page>} />
      <Route path="assets" element={<Page><AssetModuleLayout /></Page>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Page><AssetManagement /></Page>} />
        <Route path="inventory" element={<Page><AssetInventory /></Page>} />
        <Route path="categories" element={<Page><AssetCategories /></Page>} />
        <Route path="allocation" element={<Page><AssetAllocation /></Page>} />
        <Route path="requests" element={<Page><AssetRequests /></Page>} />
        <Route path="returns" element={<Page><AssetReturns /></Page>} />
        <Route path="maintenance" element={<Page><AssetMaintenance /></Page>} />
        <Route path="transfers" element={<Page><AssetTransfers /></Page>} />
        <Route path="reports" element={<Page><AssetReports /></Page>} />
      </Route>
      <Route path="approvals" element={<Page><ApprovalsInbox /></Page>} />
      <Route path="report/*" element={<Page><Reports /></Page>} />
      <Route path="onboarding" element={<Page><Onboarding /></Page>} />
      <Route path="manage" element={<Page><Manage /></Page>} />
      <Route path="manage/permissions/:roleSlug" element={<Page><ManagePermissions /></Page>} />
      <Route path="settings" element={<Page><Settings /></Page>} />
      <Route path="form-builder" element={<Page><FormBuilder /></Page>} />
      <Route path="dash-builder" element={<Page><DashboardBuilder /></Page>} />
      <Route path="menu-perm" element={<Page><MenuPermissionBuilder /></Page>} />
      <Route path="report-builder" element={<Page><ReportBuilder /></Page>} />
      <Route path="profile" element={<Page><Profile /></Page>} />
      <Route path="security/mfa" element={<Page><MfaSetup /></Page>} />
      <Route path="leave/summary" element={<Page><LeaveSummaryReport /></Page>} />
      <Route path="helpdesk" element={<Page><HelpdeskAdmin /></Page>} />
      <Route path="payroll/statement" element={<Page><AdminPayrollStatement /></Page>} />
      <Route path="payroll/ytd" element={<Page><AdminPayrollYTD /></Page>} />
      <Route path="payroll/inputs" element={<Page><AdminPayrollInputs /></Page>} />
      <Route path="payroll/compliance" element={<Page><AdminPayrollCompliance /></Page>} />
      <Route path="payroll/tax-forms" element={<Page><AdminPayrollTaxForms /></Page>} />
      <Route path="payroll/setup" element={<Page><AdminPayrollSetup /></Page>} />
      <Route path="workflow-delegation" element={<Page><AdminWorkflowDelegation /></Page>} />
      <Route path="recruitment" element={<Page><Recruitment /></Page>} />
      <Route path="recruitment/create-new" element={<Page><CreateJobPage /></Page>} />
      <Route path="role-management"       element={<Page><RoleManagement /></Page>} />
      <Route path="salary-templates"     element={<Page><SalaryTemplates /></Page>} />
      <Route path="salary-components"   element={<Page><SalaryComponents /></Page>} />
      <Route path="salary-structures"           element={<Page><SalaryStructures /></Page>} />
      <Route path="salary-structures/new"       element={<SalaryStructureEditor />} />
      <Route path="salary-structures/:id"       element={<SalaryStructureEditor />} />
      <Route path="salary-assignment"  element={<Page><SalaryAssignments /></Page>} />
      <Route path="settings/email-configuration" element={<Page><EmailConfiguration /></Page>} />
      <Route path="notification-settings" element={<Page><NotificationSettings /></Page>} />
      <Route path="audit-logs" element={<Page><AuditLogs /></Page>} />
      <Route path="notification-center" element={<Page><NotificationCenter /></Page>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </MenuPermissionGuard>
  );
};
export default AdminRoutes;
