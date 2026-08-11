import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { employeeApi } from '../../api/employee.api';
import { getInitials } from '../../utils/formatters';

const InfoRow = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={15} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
};

const Section = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const fmtDate = (s) => {
  if (!s) return null;
  try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return s; }
};

export default function EmployeeDetailScreen({ route, navigation }) {
  // EmployeeListScreen passes { id }, PeopleScreen may pass { employeeId }
  const empId = route.params?.id ?? route.params?.employeeId;
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!empId) { setLoading(false); return; }
    try {
      // employeeApi.get already unwraps — result IS the employee object
      const data = await employeeApi.get(empId);
      // Backend may return { employee: {...} } or the object directly
      setEmployee(data?.employee || data || null);
    } catch (e) {
      console.log('EmployeeDetail error', e?.message);
      setEmployee(null);
    }
  }, [empId]);

  const fetch = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading employee…</Text>
      </View>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.safeBack}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
          <Text style={{ fontSize: 14, color: COLORS.secondary, marginLeft: 6 }}>Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Ionicons name="person-outline" size={56} color={COLORS.gray200} />
          <Text style={styles.emptyTitle}>Employee not found</Text>
          <Text style={styles.emptyDesc}>ID: {empId || 'none'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Actual field names from backend (verified against web source)
  const fullName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee';
  const initials = getInitials(fullName);
  const isActive = (employee.employee_status || '').toLowerCase() === 'active';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>

        {/* Banner */}
        <LinearGradient colors={['#1a2535', '#2d3748', COLORS.primary + 'cc']} style={styles.banner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: isActive ? COLORS.success : COLORS.danger }]} />
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.jobTitle}>{employee.emp_job_title || employee.designation_name || '—'}</Text>

          <View style={styles.badgeRow}>
            {employee.emp_code && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{employee.emp_code}</Text>
              </View>
            )}
            {employee.department_name && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{employee.department_name}</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: isActive ? COLORS.success + '40' : COLORS.danger + '40' }]}>
              <Text style={styles.badgeText}>{employee.employee_status || 'Unknown'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Personal */}
        <Section title="Personal Information" icon="person-outline">
          <InfoRow icon="mail-outline" label="Email" value={employee.email} />
          <InfoRow icon="call-outline" label="Mobile" value={employee.mobile} />
          <InfoRow icon="calendar-outline" label="Date of Birth" value={fmtDate(employee.dob || employee.date_of_birth)} />
          <InfoRow icon="people-outline" label="Gender" value={employee.gender} />
          <InfoRow icon="heart-outline" label="Marital Status" value={employee.marital_status} />
          <InfoRow icon="water-outline" label="Blood Group" value={employee.blood_group} />
          <InfoRow icon="person-outline" label="Father's Name" value={employee.father_name} />
        </Section>

        {/* Employment */}
        <Section title="Work Information" icon="briefcase-outline">
          <InfoRow icon="business-outline" label="Department" value={employee.department_name} />
          <InfoRow icon="ribbon-outline" label="Designation" value={employee.designation_name} />
          <InfoRow icon="construct-outline" label="Job Title" value={employee.emp_job_title} />
          <InfoRow icon="person-outline" label="Reporting Manager" value={employee.reporting_to_name} />
          <InfoRow icon="calendar-outline" label="Date of Joining" value={fmtDate(employee.emp_joining_date)} />
          <InfoRow icon="document-outline" label="Employee Type" value={employee.employee_type} />
          <InfoRow icon="location-outline" label="Location" value={employee.location} />
          {employee.emp_exit_date && (
            <InfoRow icon="exit-outline" label="Exit Date" value={fmtDate(employee.emp_exit_date)} />
          )}
        </Section>

        {/* Contact & Emergency — nested in contactInfo */}
        {(() => {
          const ci = employee.contactInfo || {};
          return (
            <Section title="Contact & Emergency" icon="call-outline">
              <InfoRow icon="mail-outline" label="Personal Email" value={ci.personal_email || employee.personal_email} />
              <InfoRow icon="phone-portrait-outline" label="Alternate Mobile" value={ci.alternate_mobile || employee.alternate_mobile} />
              <InfoRow icon="home-outline" label="City" value={ci.contact_city} />
              <InfoRow icon="globe-outline" label="Country" value={ci.contact_country} />
              <InfoRow icon="alert-circle-outline" label="Emergency Contact" value={ci.emergency_contact_name} />
              <InfoRow icon="call-outline" label="Emergency Phone" value={ci.emergency_contact_phone} />
              <InfoRow icon="location-outline" label="Address" value={[ci.permanent_address_line1, ci.permanent_address_line2, ci.permanent_address_line3].filter(Boolean).join(', ')} />
            </Section>
          );
        })()}

        {/* Bank Details — nested in bankDetails */}
        {(() => {
          const bd = employee.bankDetails || {};
          if (!bd.bank_name && !bd.account_number) return null;
          return (
            <Section title="Bank Details" icon="card-outline">
              <InfoRow icon="business-outline" label="Bank Name" value={bd.bank_name} />
              <InfoRow icon="card-outline" label="Account Number" value={bd.account_number} />
              <InfoRow icon="barcode-outline" label="IFSC Code" value={bd.ifsc_code} />
              <InfoRow icon="document-text-outline" label="Account Type" value={bd.account_type} />
            </Section>
          );
        })()}

        {(employee.pan_number || employee.uan_number || employee.pf_number) && (
          <Section title="Statutory" icon="shield-outline">
            <InfoRow icon="document-text-outline" label="PAN Number" value={employee.pan_number} />
            <InfoRow icon="document-text-outline" label="UAN Number" value={employee.uan_number} />
            <InfoRow icon="document-text-outline" label="PF Number" value={employee.pf_number} />
            <InfoRow icon="document-text-outline" label="ESI Number" value={employee.esi_number} />
          </Section>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 24 },
  loadingText: { fontSize: 14, color: COLORS.gray400, marginTop: 8 },
  safeBack: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray400 },
  emptyDesc: { fontSize: 13, color: COLORS.gray300 },
  banner: { paddingTop: 12, paddingBottom: 28, alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { position: 'absolute', top: 14, left: 16, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  avatarWrap: { position: 'relative', marginTop: 10, marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarInitials: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  statusDot: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: COLORS.white },
  name: { fontSize: 22, fontWeight: '900', color: COLORS.white, textAlign: 'center', marginBottom: 4 },
  jobTitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 14, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  badge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  section: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 14, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.secondary },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  infoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 1 },
  infoLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, color: COLORS.secondary, fontWeight: '500' },
});
