import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;

const TABS = ['Company', 'Offices', 'Teams', 'Departments'];

const Field = ({ label, value, onChangeText, placeholder, editable = true, multiline }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput
      style={[s.input, !editable && { backgroundColor: COLORS.gray50, color: COLORS.gray400 }, multiline && { height: 70, textAlignVertical: 'top' }]}
      value={value || ''}
      onChangeText={onChangeText}
      placeholder={placeholder || label}
      placeholderTextColor={COLORS.gray300}
      editable={editable}
      multiline={multiline}
    />
  </View>
);

export default function CompanySettingsScreen({ navigation }) {
  const [tab, setTab] = useState('Company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Company data
  const [company, setCompany] = useState({ company_name: '', industry: '', website: '', email: '', phone: '', address: '', city: '', state: '', country: '', pincode: '' });
  // Offices
  const [offices, setOffices] = useState([]);
  // Teams
  const [teams, setTeams] = useState([]);
  // Departments
  const [departments, setDepartments] = useState([]);

  const loadCompany = useCallback(async () => {
    const res = await client.get('/company').then(unwrap).catch(() => ({}));
    const d = Array.isArray(res) ? res[0] : res;
    if (d) setCompany({ company_name: d.company_name || '', industry: d.industry || '', website: d.website || '', email: d.email || '', phone: d.phone || '', address: d.address || '', city: d.city || '', state: d.state || '', country: d.country || '', pincode: d.pincode || '' });
  }, []);

  const loadOffices = useCallback(async () => {
    const res = await client.get('/offices').then(unwrap).catch(() => []);
    setOffices(Array.isArray(res) ? res : res?.data || []);
  }, []);

  const loadTeams = useCallback(async () => {
    const res = await client.get('/teams').then(unwrap).catch(() => []);
    setTeams(Array.isArray(res) ? res : res?.data || []);
  }, []);

  const loadDepartments = useCallback(async () => {
    const res = await client.get('/departments').then(unwrap).catch(() => []);
    setDepartments(Array.isArray(res) ? res : res?.data || []);
  }, []);

  const load = useCallback(async () => {
    try {
      await Promise.all([loadCompany(), loadOffices(), loadTeams(), loadDepartments()]);
    } catch (e) { console.log('CompanySettings error', e?.message); }
  }, [loadCompany, loadOffices, loadTeams, loadDepartments]);

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

  const saveCompany = async () => {
    setSaving(true);
    try {
      await client.put('/company', company);
      Alert.alert('Saved', 'Company profile updated successfully.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const renderCompany = () => (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={s.sectionTitle}>Company Profile</Text>
      <Field label="Company Name" value={company.company_name} onChangeText={v => setCompany(c => ({ ...c, company_name: v }))} />
      <Field label="Industry" value={company.industry} onChangeText={v => setCompany(c => ({ ...c, industry: v }))} />
      <Field label="Website" value={company.website} onChangeText={v => setCompany(c => ({ ...c, website: v }))} placeholder="https://" />
      <Field label="Email" value={company.email} onChangeText={v => setCompany(c => ({ ...c, email: v }))} />
      <Field label="Phone" value={company.phone} onChangeText={v => setCompany(c => ({ ...c, phone: v }))} />
      <Text style={s.sectionTitle}>Address</Text>
      <Field label="Address" value={company.address} onChangeText={v => setCompany(c => ({ ...c, address: v }))} multiline />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="City" value={company.city} onChangeText={v => setCompany(c => ({ ...c, city: v }))} /></View>
        <View style={{ flex: 1 }}><Field label="State" value={company.state} onChangeText={v => setCompany(c => ({ ...c, state: v }))} /></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Country" value={company.country} onChangeText={v => setCompany(c => ({ ...c, country: v }))} /></View>
        <View style={{ flex: 1 }}><Field label="PIN Code" value={company.pincode} onChangeText={v => setCompany(c => ({ ...c, pincode: v }))} /></View>
      </View>
      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={saveCompany} disabled={saving}>
        {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={s.saveBtnText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderList = (items, labelKey, subKey, iconName, color = COLORS.primary) => (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
      {items.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name={iconName} size={48} color={COLORS.gray200} />
          <Text style={s.emptyText}>No data available</Text>
        </View>
      ) : items.map((item, i) => (
        <View key={item.id || item[`${labelKey.split('_')[0]}_id`] || i} style={s.listCard}>
          <View style={[s.listIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={iconName} size={18} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.listTitle}>{item[labelKey] || '—'}</Text>
            {subKey && item[subKey] && <Text style={s.listSub}>{item[subKey]}</Text>}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Company Settings</Text>
          <Text style={s.subtitle}>Manage company profile & structure</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tabChip, tab === t && s.tabChipActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <>
          {tab === 'Company' && renderCompany()}
          {tab === 'Offices' && renderList(offices, 'office_name', 'city', 'business-outline', COLORS.info)}
          {tab === 'Teams' && renderList(teams, 'team_name', 'description', 'people-outline', '#7c3aed')}
          {tab === 'Departments' && renderList(departments, 'department_name', 'description', 'git-branch-outline', COLORS.success)}
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  subtitle: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  tabScroll: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, paddingVertical: 10 },
  tabChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.gray100, backgroundColor: COLORS.gray50 },
  tabChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  tabTextActive: { color: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14, marginTop: 4 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, marginBottom: 6 },
  input: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: COLORS.secondary },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  listIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  listTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  listSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: COLORS.gray400 },
});
