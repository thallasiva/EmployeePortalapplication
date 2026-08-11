import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';
import { ROUTES } from '../../constants/routes';

const MenuItem = ({ icon, label, desc, route, color, navigation }) => (
  <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate(route)}>
    <View style={[styles.menuIcon, { backgroundColor: (color || COLORS.primary) + '18' }]}>
      <Ionicons name={icon} size={20} color={color || COLORS.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.menuLabel}>{label}</Text>
      {desc && <Text style={styles.menuDesc}>{desc}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={16} color={COLORS.gray300} />
  </TouchableOpacity>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

export default function MoreScreen({ navigation }) {
  const { user, logout } = useAuth();
  const name = user?.full_name || user?.name || 'Employee';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Banner */}
        <LinearGradient colors={['#1a2535', '#2d3748', COLORS.primary + 'cc']} style={styles.banner}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerName}>{name}</Text>
            <Text style={styles.bannerRole}>{user?.designation || user?.role_name || 'Employee'}</Text>
            <Text style={styles.bannerDept}>{user?.department || ''}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.PROFILE)} style={styles.editBtn}>
            <Ionicons name="pencil" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </LinearGradient>

        {/* My Info */}
        <Section title="My Profile">
          <MenuItem icon="id-card-outline" label="My Information" desc="Profile, bank, PF, emergency" route={ROUTES.MY_INFO} navigation={navigation} color="#0891b2" />
          <MenuItem icon="finger-print-outline" label="Attendance" desc="Daily, monthly, regularizations" route={ROUTES.ATTENDANCE_HISTORY} navigation={navigation} color={COLORS.success} />
          <MenuItem icon="calendar-outline" label="Leave" desc="Balance, apply, calendar" route={ROUTES.LEAVE} navigation={navigation} color="#7c3aed" />
          <MenuItem icon="calendar-number-outline" label="Calendar" desc="Events, holidays, birthdays" route={ROUTES.CALENDAR} navigation={navigation} color="#8b5cf6" />
        </Section>

        {/* Salary & Finance */}
        <Section title="Salary & Finance">
          <MenuItem icon="cash-outline" label="Payslips" desc="Download monthly payslips" route={ROUTES.PAYROLL} navigation={navigation} color={COLORS.primary} />
          <MenuItem icon="trending-up-outline" label="Salary Revision" desc="Revision history and hike details" route={ROUTES.SALARY_REVISION} navigation={navigation} color="#059669" />
          <MenuItem icon="bar-chart-outline" label="YTD Reports" desc="Year-to-date salary summary" route={ROUTES.YTD_REPORTS} navigation={navigation} color="#059669" />
          <MenuItem icon="receipt-outline" label="Reimbursements" desc="Submit and track expense claims" route={ROUTES.REIMBURSEMENTS} navigation={navigation} color="#0891b2" />
          <MenuItem icon="wallet-outline" label="Loans & Advances" desc="Active loans and EMI schedule" route={ROUTES.LOANS} navigation={navigation} color="#7c3aed" />
        </Section>

        {/* Tax & Benefits */}
        <Section title="Tax & Benefits">
          <MenuItem icon="calculator-outline" label="IT Declaration" desc="Tax exemptions and savings" route={ROUTES.IT_DECLARATION} navigation={navigation} color={COLORS.success} />
          <MenuItem icon="document-attach-outline" label="Proof of Investment" desc="Upload 80C, HRA, and other proofs" route={ROUTES.PROOF_OF_INVESTMENT} navigation={navigation} color="#db2777" />
          <MenuItem icon="stats-chart-outline" label="IT Statement" desc="Tax computation statement" route={ROUTES.IT_STATEMENT} navigation={navigation} color="#f59e0b" />
        </Section>

        {/* My Work */}
        <Section title="My Work">
          <MenuItem icon="checkbox-outline" label="Timesheet" desc="Log and review work hours" route={ROUTES.TASKS} navigation={navigation} color={COLORS.primary} />
          <MenuItem icon="ribbon-outline" label="Appraisal" desc="Performance reviews and goals" route={ROUTES.APPRAISAL} navigation={navigation} color="#db2777" />
          <MenuItem icon="layers-outline" label="Request Hub" desc="WFH, comp-off, regularization" route={ROUTES.REQUEST_HUB} navigation={navigation} color={COLORS.warning} />
          <MenuItem icon="exit-outline" label="Resignation" desc="Submit or track resignation" route={ROUTES.RESIGNATION_EMPLOYEE} navigation={navigation} color={COLORS.danger} />
        </Section>

        {/* Company */}
        <Section title="Company">
          <MenuItem icon="people-outline" label="People Directory" desc="Find your colleagues" route={ROUTES.PEOPLE} navigation={navigation} color={COLORS.primary} />
          <MenuItem icon="git-network-outline" label="Organization Chart" desc="Reporting hierarchy" route={ROUTES.ORG_CHART} navigation={navigation} color="#0891b2" />
          <MenuItem icon="radio-outline" label="Engage" desc="Announcements, polls, events" route={ROUTES.ENGAGE} navigation={navigation} color={COLORS.danger} />
          <MenuItem icon="heart-outline" label="My Worklife" desc="Kudos and feedback" route={ROUTES.WORKLIFE} navigation={navigation} color="#db2777" />
          <MenuItem icon="briefcase-outline" label="Internal Jobs" desc="Apply for internal openings" route={ROUTES.INTERNAL_JOBS} navigation={navigation} color="#7c3aed" />
        </Section>

        {/* Support */}
        <Section title="Support & Tools">
          <MenuItem icon="folder-open-outline" label="Document Center" desc="Offer letter, payslips, ID" route={ROUTES.DOCUMENTS} navigation={navigation} color="#7c3aed" />
          <MenuItem icon="headset-outline" label="Helpdesk" desc="Raise and track tickets" route={ROUTES.HELPDESK} navigation={navigation} color={COLORS.warning} />
          <MenuItem icon="git-branch-outline" label="Workflow Delegates" desc="Delegate approvals when away" route={ROUTES.WORKFLOW_DELEGATES} navigation={navigation} color={COLORS.info} />
        </Section>

        {/* Account */}
        <Section title="Account">
          <MenuItem icon="notifications-outline" label="Notifications" route={ROUTES.NOTIFICATIONS} navigation={navigation} color={COLORS.info} />
          <MenuItem icon="notifications-circle-outline" label="Notification Settings" desc="Manage alert preferences" route={ROUTES.NOTIFICATION_SETTINGS} navigation={navigation} color={COLORS.primary} />
          <MenuItem icon="lock-closed-outline" label="Change Password" desc="Update your login password" route={ROUTES.CHANGE_PASSWORD} navigation={navigation} color={COLORS.warning} />
          <MenuItem icon="settings-outline" label="Settings" route={ROUTES.SETTINGS} navigation={navigation} color={COLORS.gray500} />
        </Section>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>HRMS Mobile v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  bannerName: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  bannerRole: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bannerDept: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  section: { marginTop: 18, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray50, gap: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  menuDesc: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 24, marginTop: 20, paddingVertical: 14, backgroundColor: COLORS.danger + '15', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.danger + '30' },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.gray300, marginBottom: 24 },
});
