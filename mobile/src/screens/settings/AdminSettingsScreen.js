import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

const SettingRow = ({ icon, label, desc, onPress, value, isSwitch, color }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} disabled={isSwitch}>
    <View style={[styles.rowIcon, { backgroundColor: (color || COLORS.primary) + '15' }]}>
      <Ionicons name={icon} size={18} color={color || COLORS.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      {desc && <Text style={styles.rowDesc}>{desc}</Text>}
    </View>
    {isSwitch ? <Switch value={value} onValueChange={onPress} trackColor={{ true: COLORS.primary }} thumbColor={COLORS.white} /> : <Ionicons name="chevron-forward" size={18} color={COLORS.gray300} />}
  </TouchableOpacity>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

export default function AdminSettingsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const openWeb = (path) => Alert.alert('Web Admin', `Open ${path} in the web admin panel for full configuration.`);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Admin">
          <SettingRow icon="business-outline" label="Company Profile" desc="Edit company info, offices, teams" onPress={() => navigation.navigate('CompanySettings')} color={COLORS.info} />
          <SettingRow icon="shield-outline" label="Roles & Permissions" desc="Manage roles and access levels" onPress={() => navigation.navigate('RolesPermissions')} color={COLORS.danger} />
          <SettingRow icon="cash-outline" label="Salary Components" desc="Manage earnings and deductions" onPress={() => navigation.navigate('SalaryComponents')} color={COLORS.success} />
        </Section>

        <Section title="App Preferences">
          <SettingRow icon="notifications-outline" label="Push Notifications" desc="Leave, attendance, payroll alerts" isSwitch value={notifications} onPress={() => setNotifications(v => !v)} />
          <SettingRow icon="finger-print-outline" label="Biometric Login" desc="Use fingerprint or Face ID" isSwitch value={biometric} onPress={() => setBiometric(v => !v)} color={COLORS.success} />
          <SettingRow icon="moon-outline" label="Dark Mode" desc="Coming soon" isSwitch value={darkMode} onPress={() => setDarkMode(v => !v)} color={COLORS.secondary} />
        </Section>

        <Section title="Company Configuration">
          <SettingRow icon="mail-outline" label="Email Settings" desc="SMTP, templates, triggers" onPress={() => openWeb('Email Configuration')} color="#7c3aed" />
          <SettingRow icon="shield-checkmark-outline" label="Menu Permissions" desc="Role-based access control" onPress={() => openWeb('Menu Permissions')} color={COLORS.success} />
          <SettingRow icon="construct-outline" label="Form Builder" desc="Custom HR forms" onPress={() => openWeb('Form Builder')} color={COLORS.warning} />
          <SettingRow icon="bar-chart-outline" label="Report Builder" desc="Custom report templates" onPress={() => openWeb('Report Builder')} color={COLORS.info} />
          <SettingRow icon="grid-outline" label="Dashboard Builder" desc="Custom dashboard widgets" onPress={() => openWeb('Dashboard Builder')} color="#db2777" />
        </Section>

        <Section title="HR Configuration">
          <SettingRow icon="briefcase-outline" label="Leave Policies" desc="Types, quotas, carry forward" onPress={() => openWeb('Leave Policies')} color={COLORS.primary} />
          <SettingRow icon="cash-outline" label="Salary Components" desc="Earnings, deductions, formulas" onPress={() => openWeb('Salary Components')} color={COLORS.success} />
          <SettingRow icon="people-outline" label="Departments & Roles" desc="Org structure management" onPress={() => openWeb('Departments')} color="#0891b2" />
          <SettingRow icon="location-outline" label="Offices & Locations" desc="Work locations and shifts" onPress={() => openWeb('Offices')} color="#7c3aed" />
        </Section>

        <Section title="Security & Compliance">
          <SettingRow icon="lock-closed-outline" label="Change Password" onPress={() => navigation.navigate('ChangePassword')} color={COLORS.danger} />
          <SettingRow icon="clipboard-outline" label="Audit Logs" desc="User activity history" onPress={() => openWeb('Audit Logs')} color={COLORS.warning} />
          <SettingRow icon="shield-outline" label="Security Settings" desc="MFA, session management" onPress={() => openWeb('Security')} color={COLORS.danger} />
        </Section>

        <Section title="About">
          <SettingRow icon="information-circle-outline" label="App Version" desc="v1.0.0" onPress={() => {}} color={COLORS.gray400} />
          <SettingRow icon="globe-outline" label="Open Web Portal" onPress={() => Alert.alert('Web Portal', 'Open your HRMS web URL.')} color={COLORS.primary} />
          <SettingRow icon="help-circle-outline" label="Help & Support" onPress={() => navigation.navigate('Helpdesk')} color={COLORS.info} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  content: { paddingBottom: 40 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray50, gap: 12 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  rowDesc: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
});
