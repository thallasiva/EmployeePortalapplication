import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { employeeApi } from '../../api/employee.api';

const TABS = ['Personal', 'Bank', 'PF/ESI', 'Emergency', 'Documents'];

const InfoField = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '—'}</Text>
  </View>
);

export default function MyInfoScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Personal');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await employeeApi.myProfile();
      setProfile(res.data?.profile || res.data?.employee || res.data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const renderPersonal = () => (
    <View style={styles.tabContent}>
      <InfoField label="Full Name" value={profile?.full_name} />
      <InfoField label="Employee ID" value={profile?.employee_id || profile?.emp_id} />
      <InfoField label="Email" value={profile?.email} />
      <InfoField label="Mobile" value={profile?.phone || profile?.mobile} />
      <InfoField label="Date of Birth" value={profile?.date_of_birth} />
      <InfoField label="Gender" value={profile?.gender} />
      <InfoField label="Blood Group" value={profile?.blood_group} />
      <InfoField label="Marital Status" value={profile?.marital_status} />
      <InfoField label="Nationality" value={profile?.nationality} />
      <InfoField label="Address" value={profile?.address} />
    </View>
  );

  const renderBank = () => (
    <View style={styles.tabContent}>
      <View style={styles.alertBanner}>
        <Ionicons name="lock-closed-outline" size={14} color={COLORS.primary} />
        <Text style={styles.alertText}>Bank details are encrypted and secured.</Text>
      </View>
      <InfoField label="Bank Name" value={profile?.bank_name} />
      <InfoField label="Account Number" value={profile?.bank_account_number ? '••••' + profile.bank_account_number.slice(-4) : '—'} />
      <InfoField label="IFSC Code" value={profile?.ifsc_code} />
      <InfoField label="Account Type" value={profile?.account_type} />
      <InfoField label="Branch" value={profile?.bank_branch} />
    </View>
  );

  const renderPF = () => (
    <View style={styles.tabContent}>
      <InfoField label="PF Account Number" value={profile?.pf_account_number} />
      <InfoField label="UAN Number" value={profile?.uan_number} />
      <InfoField label="ESI Number" value={profile?.esi_number} />
      <InfoField label="PAN Number" value={profile?.pan_number} />
      <InfoField label="Aadhar Number" value={profile?.aadhar_number ? '••••' + profile.aadhar_number.slice(-4) : '—'} />
    </View>
  );

  const renderEmergency = () => (
    <View style={styles.tabContent}>
      <Text style={styles.subHeader}>Primary Contact</Text>
      <InfoField label="Name" value={profile?.emergency_contact_name} />
      <InfoField label="Relationship" value={profile?.emergency_contact_relation} />
      <InfoField label="Phone" value={profile?.emergency_contact_phone} />
      <Text style={styles.subHeader}>Secondary Contact</Text>
      <InfoField label="Name" value={profile?.emergency_contact2_name} />
      <InfoField label="Relationship" value={profile?.emergency_contact2_relation} />
      <InfoField label="Phone" value={profile?.emergency_contact2_phone} />
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.tabContent}>
      {['Offer Letter', 'Appointment Letter', 'ID Card', 'Experience Letter', 'Salary Certificate'].map(doc => (
        <TouchableOpacity key={doc} style={styles.docRow}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
          <Text style={styles.docName}>{doc}</Text>
          <Ionicons name="download-outline" size={18} color={COLORS.gray400} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    if (!profile) return <View style={styles.empty}><Text style={{ color: COLORS.gray400 }}>No data available</Text></View>;
    switch (activeTab) {
      case 'Personal': return renderPersonal();
      case 'Bank': return renderBank();
      case 'PF/ESI': return renderPF();
      case 'Emergency': return renderEmergency();
      case 'Documents': return renderDocuments();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Information</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchProfile} colors={[COLORS.primary]} />}
      >
        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} /> : renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  tabsScroll: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, maxHeight: 50 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 12, gap: 4 },
  tab: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.primary },
  content: { paddingBottom: 32 },
  tabContent: { padding: 16, gap: 0 },
  field: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray400, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, color: COLORS.secondary, fontWeight: '500' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary + '15', borderRadius: 8, padding: 10, marginBottom: 12 },
  alertText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  subHeader: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 16, marginBottom: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: 12 },
  docName: { flex: 1, fontSize: 14, color: COLORS.secondary, fontWeight: '500' },
  empty: { padding: 40, alignItems: 'center' },
});
