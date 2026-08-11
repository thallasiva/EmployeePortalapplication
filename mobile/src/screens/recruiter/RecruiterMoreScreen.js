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
    <View style={[styles.menuIcon, { backgroundColor: (color||COLORS.primary)+'18' }]}>
      <Ionicons name={icon} size={20} color={color||COLORS.primary} />
    </View>
    <View style={{flex:1}}>
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

export default function RecruiterMoreScreen({ navigation }) {
  const { user, logout } = useAuth();
  const name = user?.full_name || user?.name || 'Recruiter';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <LinearGradient colors={['#1a2535','#2d3748',COLORS.primary+'cc']} style={styles.banner}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(name)}</Text></View>
          <View style={{flex:1}}>
            <Text style={styles.bannerName}>{name}</Text>
            <Text style={styles.bannerRole}>{user?.designation || user?.role_name || 'Recruiter'}</Text>
            <Text style={styles.bannerDept}>{user?.department || ''}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.PROFILE)} style={styles.editBtn}>
            <Ionicons name="pencil" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Recruitment section - matches web Recruiter sidebar */}
        <Section title="Recruitment">
          <MenuItem icon="briefcase-outline" label="Jobs & Pipeline" desc="Manage openings and candidates" route={ROUTES.RECRUITMENT} color="#7c3aed" navigation={navigation} />
          <MenuItem icon="person-add-outline" label="Onboarding" desc="New hire onboarding tasks" route={ROUTES.ONBOARDING} color={COLORS.primary} navigation={navigation} />
          <MenuItem icon="calendar-outline" label="Interview Calendar" desc="Scheduled interviews" route={ROUTES.CALENDAR} color="#8b5cf6" navigation={navigation} />
          <MenuItem icon="people-outline" label="People Directory" desc="Search all employees" route={ROUTES.PEOPLE} color={COLORS.info} navigation={navigation} />
          <MenuItem icon="document-text-outline" label="Reports" desc="Recruitment analytics" route={ROUTES.REPORTS} color="#059669" navigation={navigation} />
        </Section>


        {/* ── Self-Service (all employees get these) ────────────────────── */}
        <Section title="Salary & Finance">
          <MenuItem icon="cash-outline" label="Payslips" desc="My monthly salary slips" route={ROUTES.PAYROLL} color={COLORS.primary} navigation={navigation} />
          <MenuItem icon="trending-up-outline" label="Salary Revision" desc="Revision history and hike details" route={ROUTES.SALARY_REVISION} color="#059669" navigation={navigation} />
          <MenuItem icon="bar-chart-outline" label="YTD Reports" desc="Year-to-date salary summary" route={ROUTES.YTD_REPORTS} color="#059669" navigation={navigation} />
          <MenuItem icon="receipt-outline" label="Reimbursements" desc="Submit and track expense claims" route={ROUTES.REIMBURSEMENTS} color="#0891b2" navigation={navigation} />
          <MenuItem icon="wallet-outline" label="Loans & Advances" desc="Active loans and EMI schedule" route={ROUTES.LOANS} color="#7c3aed" navigation={navigation} />
        </Section>

        <Section title="Tax & Benefits">
          <MenuItem icon="calculator-outline" label="IT Declaration" desc="Tax exemptions and savings" route={ROUTES.IT_DECLARATION} color={COLORS.success} navigation={navigation} />
          <MenuItem icon="document-attach-outline" label="Proof of Investment" desc="Upload 80C, HRA, and other proofs" route={ROUTES.PROOF_OF_INVESTMENT} color="#db2777" navigation={navigation} />
          <MenuItem icon="stats-chart-outline" label="IT Statement" desc="Tax computation statement" route={ROUTES.IT_STATEMENT} color="#f59e0b" navigation={navigation} />
        </Section>

        <Section title="My Work">
          <MenuItem icon="checkbox-outline" label="My Tasks" desc="Assigned tasks and deadlines" route={ROUTES.TASKS} color={COLORS.primary} navigation={navigation} />
          <MenuItem icon="ribbon-outline" label="My Appraisal" desc="Performance reviews and goals" route={ROUTES.APPRAISAL} color="#db2777" navigation={navigation} />
          <MenuItem icon="layers-outline" label="Request Hub" desc="WFH, comp-off, regularization" route={ROUTES.REQUEST_HUB} color={COLORS.warning} navigation={navigation} />
          <MenuItem icon="exit-outline" label="Resignation" desc="Submit or track resignation" route={ROUTES.RESIGNATION_EMPLOYEE} color={COLORS.danger} navigation={navigation} />
        </Section>

        <Section title="Company">
          <MenuItem icon="people-outline" label="People Directory" desc="Find your colleagues" route={ROUTES.PEOPLE} color={COLORS.primary} navigation={navigation} />
          <MenuItem icon="git-network-outline" label="Organization Chart" desc="Reporting hierarchy" route={ROUTES.ORG_CHART} color="#0891b2" navigation={navigation} />
          <MenuItem icon="radio-outline" label="Engage" desc="Announcements, polls, events" route={ROUTES.ENGAGE} color={COLORS.danger} navigation={navigation} />
          <MenuItem icon="heart-outline" label="My Worklife" desc="Kudos and feedback" route={ROUTES.WORKLIFE} color="#db2777" navigation={navigation} />
          <MenuItem icon="briefcase-outline" label="Internal Jobs" desc="Apply for internal openings" route={ROUTES.INTERNAL_JOBS} color="#7c3aed" navigation={navigation} />
        </Section>

        <Section title="Support & Tools">
          <MenuItem icon="folder-open-outline" label="My Documents" desc="Offer letter, payslips, ID" route={ROUTES.DOCUMENTS} color="#7c3aed" navigation={navigation} />
          <MenuItem icon="headset-outline" label="Helpdesk" desc="Raise and track tickets" route={ROUTES.HELPDESK} color={COLORS.warning} navigation={navigation} />
          <MenuItem icon="git-branch-outline" label="Workflow Delegates" desc="Delegate approvals when away" route={ROUTES.WORKFLOW_DELEGATES} color={COLORS.info} navigation={navigation} />
        </Section>

        <Section title="Account">
          <MenuItem icon="notifications-outline" label="Notifications" route={ROUTES.NOTIFICATIONS} color={COLORS.info} navigation={navigation} />
          <MenuItem icon="notifications-circle-outline" label="Notification Settings" desc="Manage alert preferences" route={ROUTES.NOTIFICATION_SETTINGS} color={COLORS.primary} navigation={navigation} />
          <MenuItem icon="lock-closed-outline" label="Change Password" desc="Update your login password" route={ROUTES.CHANGE_PASSWORD} color={COLORS.warning} navigation={navigation} />
          <MenuItem icon="settings-outline" label="Settings" route={ROUTES.SETTINGS} color={COLORS.gray500} navigation={navigation} />
        </Section>


        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.version}>HRMS Mobile v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  banner:{flexDirection:'row',alignItems:'center',padding:20,gap:14},
  avatar:{width:52,height:52,borderRadius:26,backgroundColor:COLORS.primary,justifyContent:'center',alignItems:'center',borderWidth:2,borderColor:'rgba(255,255,255,0.3)'},
  avatarText:{fontSize:18,fontWeight:'900',color:COLORS.white},
  bannerName:{fontSize:16,fontWeight:'800',color:COLORS.white},
  bannerRole:{fontSize:12,color:'rgba(255,255,255,0.6)',marginTop:2},
  bannerDept:{fontSize:12,color:'rgba(255,255,255,0.5)'},
  editBtn:{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,0.15)',justifyContent:'center',alignItems:'center'},
  section:{marginHorizontal:16,marginTop:20},
  sectionTitle:{fontSize:11,fontWeight:'800',color:COLORS.gray400,textTransform:'uppercase',letterSpacing:1,marginBottom:8},
  sectionCard:{backgroundColor:COLORS.white,borderRadius:14,overflow:'hidden',shadowColor:'#000',shadowOpacity:0.04,shadowRadius:4,elevation:2},
  menuItem:{flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:13,gap:12,borderBottomWidth:1,borderBottomColor:COLORS.gray50},
  menuIcon:{width:38,height:38,borderRadius:10,justifyContent:'center',alignItems:'center'},
  menuLabel:{fontSize:14,fontWeight:'700',color:COLORS.secondary},
  menuDesc:{fontSize:12,color:COLORS.gray500,marginTop:1},
  logoutBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,margin:24,paddingVertical:14,backgroundColor:COLORS.danger+'15',borderRadius:14,borderWidth:1.5,borderColor:COLORS.danger+'30'},
  logoutText:{fontSize:15,fontWeight:'700',color:COLORS.danger},
  version:{textAlign:'center',fontSize:12,color:COLORS.gray300,marginBottom:24},
});
