import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { ROUTES } from '../constants/routes';

// ─── Auth ──────────────────────────────────────────────────────────────────
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// ─── Shared / Employee ────────────────────────────────────────────────────
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import AttendanceHistoryScreen from '../screens/attendance/AttendanceHistoryScreen';
import LeaveScreen from '../screens/leave/LeaveScreen';
import ApplyLeaveScreen from '../screens/leave/ApplyLeaveScreen';
import LeaveApprovalScreen from '../screens/leave/LeaveApprovalScreen';
import PayrollScreen from '../screens/payroll/PayrollScreen';
import PayslipDetailScreen from '../screens/payroll/PayslipDetailScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MoreScreen from '../screens/profile/MoreScreen';
import MyInfoScreen from '../screens/myinfo/MyInfoScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import AppraisalScreen from '../screens/appraisal/AppraisalScreen';
import EngageScreen from '../screens/engage/EngageScreen';
import PeopleScreen from '../screens/people/PeopleScreen';
import WorklifeScreen from '../screens/worklife/WorklifeScreen';
import ITDeclarationScreen from '../screens/itdeclaration/ITDeclarationScreen';
import HelpdeskScreen from '../screens/helpdesk/HelpdeskScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';

// ─── New Employee Screens ─────────────────────────────────────────────────
import OrgChartScreen from '../screens/employees/OrgChartScreen';
import RequestHubScreen from '../screens/attendance/RequestHubScreen';
import ResignationEmployeeScreen from '../screens/resignations/ResignationEmployeeScreen';
import WorkflowDelegatesScreen from '../screens/workflow/WorkflowDelegatesScreen';
import InternalJobsScreen from '../screens/recruitment/InternalJobsScreen';

// ─── New Employee Payroll Screens ─────────────────────────────────────────
import SalaryRevisionScreen from '../screens/payroll/SalaryRevisionScreen';
import YTDReportsScreen from '../screens/payroll/YTDReportsScreen';
import ITStatementScreen from '../screens/payroll/ITStatementScreen';
import ProofOfInvestmentScreen from '../screens/payroll/ProofOfInvestmentScreen';
import ReimbursementsScreen from '../screens/payroll/ReimbursementsScreen';
import LoansScreen from '../screens/payroll/LoansScreen';

// ─── Admin ────────────────────────────────────────────────────────────────
import EmployeeListScreen from '../screens/employees/EmployeeListScreen';
import EmployeeDetailScreen from '../screens/employees/EmployeeDetailScreen';
import CreateEmployeeScreen from '../screens/employees/CreateEmployeeScreen';
import AdminAttendanceScreen from '../screens/attendance/AdminAttendanceScreen';
import AdminLeaveScreen from '../screens/leave/AdminLeaveScreen';
import PayrollAdminScreen from '../screens/payroll/PayrollAdminScreen';
import RecruitmentScreen from '../screens/recruitment/RecruitmentScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import TimesheetsScreen from '../screens/timesheets/TimesheetsScreen';
import PerformanceAdminScreen from '../screens/performance/PerformanceAdminScreen';
import ResignationsScreen from '../screens/resignations/ResignationsScreen';
import WorkflowScreen from '../screens/workflow/WorkflowScreen';
import AdminSettingsScreen from '../screens/settings/AdminSettingsScreen';
import SalaryStructuresScreen from '../screens/salary/SalaryStructuresScreen';
import SalaryComponentsScreen from '../screens/salary/SalaryComponentsScreen';
import SalaryAssignmentScreen from '../screens/salary/SalaryAssignmentScreen';
import SalaryTemplatesScreen from '../screens/salary/SalaryTemplatesScreen';
import CompanySettingsScreen from '../screens/settings/CompanySettingsScreen';
import PayrollInputsScreen from '../screens/payroll/PayrollInputsScreen';
import PayrollVerifyScreen from '../screens/payroll/PayrollVerifyScreen';
import PublishedInfoScreen from '../screens/payroll/PublishedInfoScreen';
import AdminDocumentsScreen from '../screens/documents/AdminDocumentsScreen';
import RolesPermissionsScreen from '../screens/settings/RolesPermissionsScreen';

// ─── Manager ─────────────────────────────────────────────────────────────
import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen';
import TeamAttendanceScreen from '../screens/manager/TeamAttendanceScreen';
import TeamLeaveScreen from '../screens/manager/TeamLeaveScreen';
import ManagerMoreScreen from '../screens/manager/ManagerMoreScreen';

// ─── Recruiter ───────────────────────────────────────────────────────────

// ─── New Detail / Feature Screens (Task #27) ─────────────────────────────
import TeamRegularizationsScreen from '../screens/manager/TeamRegularizationsScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import TicketDetailScreen from '../screens/helpdesk/TicketDetailScreen';
import RaiseTicketScreen from '../screens/helpdesk/RaiseTicketScreen';
import ResignationDetailScreen from '../screens/resignations/ResignationDetailScreen';
import JobDetailScreen from '../screens/recruitment/JobDetailScreen';
import CandidateDetailScreen from '../screens/recruitment/CandidateDetailScreen';
import OnboardingDetailScreen from '../screens/onboarding/OnboardingDetailScreen';
import DocumentDetailScreen from '../screens/documents/DocumentDetailScreen';
import AppraisalDetailScreen from '../screens/appraisal/AppraisalDetailScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import LeaveDetailScreen from '../screens/leave/LeaveDetailScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import AuditLogsScreen from '../screens/settings/AuditLogsScreen';
import RecruiterDashboardScreen from '../screens/recruiter/RecruiterDashboardScreen';
import RecruiterMoreScreen from '../screens/recruiter/RecruiterMoreScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_BAR_STYLE = {
  backgroundColor: COLORS.white,
  borderTopWidth: 1,
  borderTopColor: COLORS.gray100,
  height: 80,
  paddingBottom: 16,
  paddingTop: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 10,
};

const TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.gray400,
  tabBarStyle: TAB_BAR_STYLE,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN TABS
// ─────────────────────────────────────────────────────────────────────────────
function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_SCREEN_OPTIONS}>
      <Tab.Screen name={ROUTES.DASHBOARD} component={DashboardScreen}
        options={{ title: 'Home', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'home':'home-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.EMPLOYEES} component={EmployeeListScreen}
        options={{ title: 'Employees', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'people':'people-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.ATTENDANCE} component={AdminAttendanceScreen}
        options={{ title: 'Attendance', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'finger-print':'finger-print-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.LEAVE} component={AdminLeaveScreen}
        options={{ title: 'Leave', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'calendar':'calendar-outline'} size={22} color={color} /> }} />
      <Tab.Screen name="AdminMore" component={AdminMoreStack}
        options={{ title: 'More', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'grid':'grid-outline'} size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MANAGER TABS
// ─────────────────────────────────────────────────────────────────────────────
function ManagerTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_SCREEN_OPTIONS}>
      <Tab.Screen name={ROUTES.DASHBOARD} component={ManagerDashboardScreen}
        options={{ title: 'Home', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'home':'home-outline'} size={22} color={color} /> }} />
      <Tab.Screen name="TeamAttendance" component={TeamAttendanceScreen}
        options={{ title: 'Attendance', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'finger-print':'finger-print-outline'} size={22} color={color} /> }} />
      <Tab.Screen name="TeamLeave" component={TeamLeaveScreen}
        options={{ title: 'Leave', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'calendar':'calendar-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.PAYROLL} component={PayrollScreen}
        options={{ title: 'Payslips', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'cash':'cash-outline'} size={22} color={color} /> }} />
      <Tab.Screen name="ManagerMore" component={ManagerMoreScreen}
        options={{ title: 'More', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'apps':'apps-outline'} size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECRUITER TABS
// ─────────────────────────────────────────────────────────────────────────────
function RecruiterTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_SCREEN_OPTIONS}>
      <Tab.Screen name={ROUTES.DASHBOARD} component={RecruiterDashboardScreen}
        options={{ title: 'Home', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'home':'home-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.RECRUITMENT} component={RecruitmentScreen}
        options={{ title: 'Jobs', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'briefcase':'briefcase-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.ONBOARDING} component={OnboardingScreen}
        options={{ title: 'Onboarding', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'person-add':'person-add-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.PAYROLL} component={PayrollScreen}
        options={{ title: 'Payslips', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'cash':'cash-outline'} size={22} color={color} /> }} />
      <Tab.Screen name="RecruiterMore" component={RecruiterMoreScreen}
        options={{ title: 'More', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'apps':'apps-outline'} size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE TABS
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_SCREEN_OPTIONS}>
      <Tab.Screen name={ROUTES.DASHBOARD} component={DashboardScreen}
        options={{ title: 'Home', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'home':'home-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.ATTENDANCE} component={AttendanceScreen}
        options={{ title: 'Attendance', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'finger-print':'finger-print-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.LEAVE} component={LeaveScreen}
        options={{ title: 'Leave', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'calendar':'calendar-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.PAYROLL} component={PayrollScreen}
        options={{ title: 'Payslips', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'cash':'cash-outline'} size={22} color={color} /> }} />
      <Tab.Screen name={ROUTES.MORE} component={MoreScreen}
        options={{ title: 'More', tabBarIcon: ({ focused, color }) => <Ionicons name={focused?'apps':'apps-outline'} size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MORE STACK  (updated to include Verify, Published Info, Payroll Admin)
// ─────────────────────────────────────────────────────────────────────────────
function AdminMoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMoreHome" component={AdminMoreHome} />
    </Stack.Navigator>
  );
}

function AdminMoreHome({ navigation }) {
  const { logout, user } = useAuth();
  const { getInitials } = require('../utils/formatters');
  const { LinearGradient } = require('expo-linear-gradient');
  const { ScrollView, TouchableOpacity, StyleSheet } = require('react-native');

  // Matches web admin sidebar order exactly (24 items)
  const items = [
    { label: 'Timesheets',     icon: 'time-outline',           route: ROUTES.TIMESHEETS,      color: COLORS.warning },
    { label: 'Calendar',       icon: 'calendar-outline',        route: ROUTES.CALENDAR,        color: '#8b5cf6' },
    { label: 'Payroll',        icon: 'play-circle-outline',     route: 'PayrollAdmin',         color: COLORS.primary },
    { label: 'Payroll Inputs', icon: 'create-outline',          route: ROUTES.PAYROLL_INPUTS,  color: '#f59e0b' },
    { label: 'Verify',         icon: 'checkmark-circle-outline',route: ROUTES.PAYROLL_VERIFY,  color: '#059669' },
    { label: 'Published Info', icon: 'cloud-upload-outline',    route: ROUTES.PUBLISHED_INFO,  color: '#0891b2' },
    { label: 'Payroll Setup',  icon: 'settings-outline',        route: ROUTES.SALARY_STRUCTURES, color: '#059669' },
    { label: 'Salary Comp.',   icon: 'pricetag-outline',        route: 'SalaryComponents',     color: COLORS.success },
    { label: 'Salary Assign',  icon: 'person-outline',          route: ROUTES.SALARY_ASSIGNMENT, color: '#f59e0b' },
    { label: 'Salary Templ.',  icon: 'layers-outline',          route: ROUTES.SALARY_TEMPLATES,color: '#6366f1' },
    { label: 'Onboarding',     icon: 'person-add-outline',      route: ROUTES.ONBOARDING,      color: COLORS.primary },
    { label: 'Recruitment',    icon: 'briefcase-outline',        route: ROUTES.RECRUITMENT,     color: '#7c3aed' },
    { label: 'Appraisal',      icon: 'ribbon-outline',          route: ROUTES.PERFORMANCE_ADMIN, color: '#db2777' },
    { label: 'Resignation',    icon: 'exit-outline',            route: ROUTES.RESIGNATIONS,    color: COLORS.danger },
    { label: 'Leave Mgmt',     icon: 'calendar-number-outline', route: 'AdminLeave',           color: COLORS.info },
    { label: 'Reports',        icon: 'bar-chart-outline',       route: ROUTES.REPORTS,         color: '#059669' },
    { label: 'Documents',      icon: 'folder-outline',          route: 'AdminDocuments',       color: '#0891b2' },
    { label: 'Helpdesk',       icon: 'headset-outline',         route: ROUTES.HELPDESK,        color: COLORS.warning },
    { label: 'Company',        icon: 'business-outline',        route: 'CompanySettings',      color: COLORS.info },
    { label: 'Workflow',       icon: 'git-merge-outline',       route: ROUTES.WORKFLOW,        color: '#0891b2' },
    { label: 'Role Mgmt',      icon: 'shield-outline',          route: 'RolesPermissions',     color: COLORS.danger },
    { label: 'People',         icon: 'people-circle-outline',   route: ROUTES.PEOPLE,          color: COLORS.primary },
    { label: 'Engage',         icon: 'heart-outline',           route: ROUTES.ENGAGE,          color: COLORS.danger },
    { label: 'IT Declare',     icon: 'calculator-outline',      route: ROUTES.IT_DECLARATION,  color: '#7c3aed' },
    { label: 'Notif. Prefs',  icon: 'notifications-circle-outline', route: ROUTES.NOTIFICATION_SETTINGS, color: COLORS.primary },
    { label: 'Audit Logs',     icon: 'shield-checkmark-outline', route: ROUTES.AUDIT_LOGS,      color: '#7c3aed' },
    { label: 'Settings',       icon: 'cog-outline',             route: ROUTES.SETTINGS,        color: COLORS.gray500 },
    { label: 'Profile',        icon: 'person-circle-outline',   route: ROUTES.PROFILE,         color: COLORS.secondary },
  ];

  const name = user?.full_name || user?.name || 'Admin';
  const RNSafeAreaView = require('react-native-safe-area-context').SafeAreaView;

  return (
    <RNSafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView>
        <LinearGradient colors={['#1a2535','#2d3748',COLORS.primary+'cc']} style={{ flexDirection:'row',alignItems:'center',padding:20,gap:14 }}>
          <View style={{ width:52,height:52,borderRadius:26,backgroundColor:COLORS.primary,justifyContent:'center',alignItems:'center',borderWidth:2,borderColor:'rgba(255,255,255,0.3)' }}>
            <Text style={{ fontSize:18,fontWeight:'900',color:COLORS.white }}>{getInitials(name)}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:16,fontWeight:'800',color:COLORS.white }}>{name}</Text>
            <Text style={{ fontSize:12,color:'rgba(255,255,255,0.6)',marginTop:2 }}>{user?.role_name||'Admin'}</Text>
          </View>
        </LinearGradient>
        <View style={{ padding:16 }}>
          <Text style={{ fontSize:11,fontWeight:'800',color:COLORS.gray400,textTransform:'uppercase',letterSpacing:1,marginBottom:12 }}>Admin Tools</Text>
          <View style={{ flexDirection:'row',flexWrap:'wrap',gap:10 }}>
            {items.map(item => (
              <TouchableOpacity key={item.label} onPress={() => navigation.navigate(item.route)} style={{ width:'22%',alignItems:'center',gap:6 }}>
                <View style={{ width:52,height:52,borderRadius:14,backgroundColor:item.color+'15',justifyContent:'center',alignItems:'center' }}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={{ fontSize:10,color:COLORS.gray600||COLORS.gray500,textAlign:'center',fontWeight:'600',lineHeight:13 }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Self-Service (same as all employees) ─────────────────────── */}
        <View style={{ paddingHorizontal:16, paddingBottom:8 }}>
          <Text style={{ fontSize:11,fontWeight:'800',color:COLORS.gray400,textTransform:'uppercase',letterSpacing:1,marginBottom:12 }}>My Self-Service</Text>
          <View style={{ backgroundColor:COLORS.white,borderRadius:14,overflow:'hidden',shadowColor:'#000',shadowOpacity:0.04,shadowRadius:4,elevation:2 }}>
            {[
              { icon:'id-card-outline',       label:'My Information',       route:ROUTES.MY_INFO,               color:'#0891b2' },
              { icon:'finger-print-outline',   label:'My Attendance',        route:ROUTES.ATTENDANCE_HISTORY,    color:COLORS.success },
              { icon:'calendar-outline',       label:'My Leaves',            route:ROUTES.LEAVE,                 color:'#7c3aed' },
              { icon:'cash-outline',           label:'My Payslips',          route:ROUTES.PAYROLL,               color:COLORS.primary },
              { icon:'trending-up-outline',    label:'Salary Revision',      route:ROUTES.SALARY_REVISION,       color:'#059669' },
              { icon:'bar-chart-outline',      label:'YTD Reports',          route:ROUTES.YTD_REPORTS,           color:'#059669' },
              { icon:'receipt-outline',        label:'Reimbursements',       route:ROUTES.REIMBURSEMENTS,        color:'#0891b2' },
              { icon:'wallet-outline',         label:'Loans & Advances',     route:ROUTES.LOANS,                 color:'#7c3aed' },
              { icon:'calculator-outline',     label:'IT Declaration',       route:ROUTES.IT_DECLARATION,        color:COLORS.success },
              { icon:'document-attach-outline',label:'Proof of Investment',  route:ROUTES.PROOF_OF_INVESTMENT,   color:'#db2777' },
              { icon:'stats-chart-outline',    label:'IT Statement',         route:ROUTES.IT_STATEMENT,          color:'#f59e0b' },
              { icon:'checkbox-outline',       label:'My Tasks',             route:ROUTES.TASKS,                 color:COLORS.primary },
              { icon:'ribbon-outline',         label:'My Appraisal',         route:ROUTES.APPRAISAL,             color:'#db2777' },
              { icon:'layers-outline',         label:'Request Hub',          route:ROUTES.REQUEST_HUB,           color:COLORS.warning },
              { icon:'exit-outline',           label:'Resignation',          route:ROUTES.RESIGNATION_EMPLOYEE,  color:COLORS.danger },
              { icon:'people-outline',         label:'People Directory',     route:ROUTES.PEOPLE,                color:COLORS.primary },
              { icon:'git-network-outline',    label:'Org Chart',            route:ROUTES.ORG_CHART,             color:'#0891b2' },
              { icon:'radio-outline',          label:'Engage',               route:ROUTES.ENGAGE,                color:COLORS.danger },
              { icon:'heart-outline',          label:'Worklife',             route:ROUTES.WORKLIFE,              color:'#db2777' },
              { icon:'briefcase-outline',      label:'Internal Jobs',        route:ROUTES.INTERNAL_JOBS,         color:'#7c3aed' },
              { icon:'folder-open-outline',    label:'My Documents',         route:ROUTES.DOCUMENTS,             color:'#7c3aed' },
              { icon:'git-branch-outline',     label:'Workflow Delegates',   route:ROUTES.WORKFLOW_DELEGATES,    color:COLORS.info },
              { icon:'lock-closed-outline',    label:'Change Password',      route:ROUTES.CHANGE_PASSWORD,       color:COLORS.warning },
              { icon:'notifications-circle-outline', label:'Notif. Settings',route:ROUTES.NOTIFICATION_SETTINGS,color:COLORS.primary },
            ].map(item => (
              <TouchableOpacity key={item.label} onPress={() => navigation.navigate(item.route)}
                style={{ flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:13,gap:12,borderBottomWidth:1,borderBottomColor:COLORS.gray50||'#f9fafb' }}>
                <View style={{ width:38,height:38,borderRadius:10,backgroundColor:item.color+'18',justifyContent:'center',alignItems:'center' }}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={{ flex:1,fontSize:14,fontWeight:'600',color:COLORS.secondary||'#1a2535' }}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray300||'#d1d5db'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={{ flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,margin:24,paddingVertical:14,backgroundColor:COLORS.danger+'15',borderRadius:14,borderWidth:1.5,borderColor:COLORS.danger+'30' }}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={{ fontSize:15,fontWeight:'700',color:COLORS.danger }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </RNSafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP STACK — role-aware
// ─────────────────────────────────────────────────────────────────────────────
function AppStack({ role }) {
  let Tabs;
  if (role.isAdmin || role.isHRManager) Tabs = AdminTabs;
  else if (role.isTL) Tabs = ManagerTabs;
  else if (role.isRecruiter) Tabs = RecruiterTabs;
  else Tabs = EmployeeTabs;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />

      {/* Universal */}
      <Stack.Screen name={ROUTES.NOTIFICATIONS} component={NotificationsScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
      <Stack.Screen name={ROUTES.CALENDAR} component={CalendarScreen} />
      <Stack.Screen name={ROUTES.HELPDESK} component={HelpdeskScreen} />
      <Stack.Screen name={ROUTES.REPORTS} component={ReportsScreen} />
      <Stack.Screen name={ROUTES.SETTINGS} component={AdminSettingsScreen} />
      <Stack.Screen name={ROUTES.PEOPLE} component={PeopleScreen} />

      {/* Employee Self-Service */}
      <Stack.Screen name={ROUTES.ATTENDANCE_HISTORY} component={AttendanceHistoryScreen} />
      <Stack.Screen name={ROUTES.LEAVE_APPLY} component={ApplyLeaveScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name={ROUTES.LEAVE_APPROVAL} component={LeaveApprovalScreen} />
      <Stack.Screen name={ROUTES.PAYSLIP_DETAIL} component={PayslipDetailScreen} />
      <Stack.Screen name={ROUTES.MY_INFO} component={MyInfoScreen} />
      <Stack.Screen name={ROUTES.DOCUMENTS} component={DocumentsScreen} />
      <Stack.Screen name={ROUTES.TASKS} component={TasksScreen} />
      <Stack.Screen name={ROUTES.APPRAISAL} component={AppraisalScreen} />
      <Stack.Screen name={ROUTES.ENGAGE} component={EngageScreen} />
      <Stack.Screen name={ROUTES.WORKLIFE} component={WorklifeScreen} />
      <Stack.Screen name={ROUTES.IT_DECLARATION} component={ITDeclarationScreen} />
      <Stack.Screen name={ROUTES.PAYROLL} component={PayrollScreen} />

      {/* New Employee screens */}
      <Stack.Screen name={ROUTES.ORG_CHART} component={OrgChartScreen} />
      <Stack.Screen name={ROUTES.REQUEST_HUB} component={RequestHubScreen} />
      <Stack.Screen name={ROUTES.RESIGNATION_EMPLOYEE} component={ResignationEmployeeScreen} />
      <Stack.Screen name={ROUTES.WORKFLOW_DELEGATES} component={WorkflowDelegatesScreen} />
      <Stack.Screen name={ROUTES.INTERNAL_JOBS} component={InternalJobsScreen} />

      {/* New Employee Payroll screens */}
      <Stack.Screen name={ROUTES.SALARY_REVISION} component={SalaryRevisionScreen} />
      <Stack.Screen name={ROUTES.YTD_REPORTS} component={YTDReportsScreen} />
      <Stack.Screen name={ROUTES.IT_STATEMENT} component={ITStatementScreen} />
      <Stack.Screen name={ROUTES.PROOF_OF_INVESTMENT} component={ProofOfInvestmentScreen} />
      <Stack.Screen name={ROUTES.REIMBURSEMENTS} component={ReimbursementsScreen} />
      <Stack.Screen name={ROUTES.LOANS} component={LoansScreen} />

      {/* Employee Detail */}
      <Stack.Screen name={ROUTES.EMPLOYEE_DETAIL} component={EmployeeDetailScreen} />
      <Stack.Screen name="PeopleDetail" component={EmployeeDetailScreen} />

      {/* Manager */}
      <Stack.Screen name="TeamAttendance" component={TeamAttendanceScreen} />
      <Stack.Screen name="TeamLeave" component={TeamLeaveScreen} />

      {/* Admin / HR Manager */}
      <Stack.Screen name={ROUTES.EMPLOYEES} component={EmployeeListScreen} />
      <Stack.Screen name="EmployeeCreate" component={CreateEmployeeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AdminAttendance" component={AdminAttendanceScreen} />
      <Stack.Screen name="AdminLeave" component={AdminLeaveScreen} />
      <Stack.Screen name="PayrollAdmin" component={PayrollAdminScreen} />
      <Stack.Screen name={ROUTES.RECRUITMENT} component={RecruitmentScreen} />
      <Stack.Screen name={ROUTES.ONBOARDING} component={OnboardingScreen} />
      <Stack.Screen name={ROUTES.TIMESHEETS} component={TimesheetsScreen} />
      <Stack.Screen name={ROUTES.PERFORMANCE_ADMIN} component={PerformanceAdminScreen} />
      <Stack.Screen name={ROUTES.RESIGNATIONS} component={ResignationsScreen} />
      <Stack.Screen name={ROUTES.WORKFLOW} component={WorkflowScreen} />
      <Stack.Screen name={ROUTES.SALARY_STRUCTURES} component={SalaryStructuresScreen} />
      <Stack.Screen name="SalaryComponents" component={SalaryComponentsScreen} />
      <Stack.Screen name={ROUTES.SALARY_ASSIGNMENT} component={SalaryAssignmentScreen} />
      <Stack.Screen name={ROUTES.SALARY_TEMPLATES} component={SalaryTemplatesScreen} />
      <Stack.Screen name="CompanySettings" component={CompanySettingsScreen} />
      <Stack.Screen name="RolesPermissions" component={RolesPermissionsScreen} />
      <Stack.Screen name={ROUTES.PAYROLL_INPUTS} component={PayrollInputsScreen} />
      <Stack.Screen name={ROUTES.PAYROLL_VERIFY} component={PayrollVerifyScreen} />
      <Stack.Screen name={ROUTES.PUBLISHED_INFO} component={PublishedInfoScreen} />
      <Stack.Screen name="AdminDocuments" component={AdminDocumentsScreen} />

      {/* ── New Detail Screens (Task #27) ─────────────────────────────── */}
      <Stack.Screen name={ROUTES.TEAM_REGULARIZATIONS} component={TeamRegularizationsScreen} />
      <Stack.Screen name={ROUTES.CHANGE_PASSWORD} component={ChangePasswordScreen} />
      <Stack.Screen name={ROUTES.TICKET_DETAIL} component={TicketDetailScreen} />
      <Stack.Screen name={ROUTES.RAISE_TICKET} component={RaiseTicketScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name={ROUTES.RESIGNATION_DETAIL} component={ResignationDetailScreen} />
      <Stack.Screen name={ROUTES.JOB_DETAIL} component={JobDetailScreen} />
      <Stack.Screen name={ROUTES.CANDIDATE_DETAIL} component={CandidateDetailScreen} />
      <Stack.Screen name={ROUTES.ONBOARDING_DETAIL} component={OnboardingDetailScreen} />
      <Stack.Screen name={ROUTES.DOCUMENT_DETAIL} component={DocumentDetailScreen} />
      <Stack.Screen name={ROUTES.APPRAISAL_DETAIL} component={AppraisalDetailScreen} />
      <Stack.Screen name={ROUTES.TASK_DETAIL} component={TaskDetailScreen} />
      <Stack.Screen name={ROUTES.LEAVE_DETAIL} component={LeaveDetailScreen} />
      <Stack.Screen name={ROUTES.NOTIFICATION_SETTINGS} component={NotificationSettingsScreen} />
      <Stack.Screen name={ROUTES.AUDIT_LOGS} component={AuditLogsScreen} />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  const role = {
    isAdmin:     user?.role === 1 || user?.role === '1',
    isHRManager: user?.role === 2 || user?.role === '2',
    isTL:        user?.role === 3 || user?.role === 4 || user?.role === '3' || user?.role === '4',
    isRecruiter: user?.role === 5 || user?.role === '5',
  };

  return (
    <NavigationContainer>
      <AppStack role={role} />
    </NavigationContainer>
  );
}
