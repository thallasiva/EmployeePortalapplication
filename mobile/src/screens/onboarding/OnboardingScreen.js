import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { onboardingApi } from '../../api/onboarding.api';

const TABS = ['Active', 'Joining Formalities', 'Completed'];
const STATUS_COLORS = { active: COLORS.info, completed: COLORS.success, pending: COLORS.warning, pending_verification: COLORS.warning, submitted: COLORS.primary, approved: COLORS.success, rejected: COLORS.danger };

export default function OnboardingScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Active');
  const [data, setData] = useState({ active: [], formalities: [], completed: [] });
  const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, formalRes, compRes] = await Promise.all([
        onboardingApi.list({ status: 'pending' }),
        onboardingApi.list({ status: 'all' }),
        onboardingApi.list({ status: 'completed' }),
      ]);
      const active = activeRes.data?.employees || activeRes.data || [];
      const formalities = formalRes.data?.records || formalRes.data || [];
      const completed = compRes.data?.employees || compRes.data || [];
      setData({ active, formalities, completed });
      setStats({ active: active.length, pending: formalities.filter(f => ['submitted', 'pending_verification'].includes(f.status)).length, completed: completed.length });
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const renderActive = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('OnboardingDetail', { onboardingId: item.id || item.onboarding_id })}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(item.full_name || item.candidate_name || 'U')[0]}</Text></View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.full_name || item.candidate_name}</Text>
        <Text style={styles.cardSub}>{item.designation || item.position}</Text>
        <Text style={styles.cardDate}>Joining: {item.date_of_joining || item.joining_date || '—'}</Text>
        {item.checklist_progress != null && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${item.checklist_progress}%` }]} /></View>
            <Text style={styles.progressPct}>{item.checklist_progress}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFormality = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || COLORS.gray400;
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('OnboardingDetail', { onboardingId: item.id || item.onboarding_id })}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: '#7c3aed' }]}><Text style={styles.avatarText}>{(item.full_name || item.candidate_name || 'U')[0]}</Text></View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.full_name || item.candidate_name}</Text>
          <Text style={styles.cardSub}>{item.designation || item.position}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{(item.status || '').replace('_', ' ')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCompleted = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: COLORS.success }]}><Text style={styles.avatarText}>{(item.full_name || 'U')[0]}</Text></View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.full_name}</Text>
        <Text style={styles.cardSub}>{item.designation}</Text>
        <Text style={styles.cardDate}>Joined: {item.date_of_joining || item.joining_date}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
    </View>
  );

  const getListData = () => ({ 'Active': data.active, 'Joining Formalities': data.formalities, 'Completed': data.completed }[activeTab] || []);
  const getRenderItem = () => ({ 'Active': renderActive, 'Joining Formalities': renderFormality, 'Completed': renderCompleted }[activeTab]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Onboarding</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.statsRow}>
        {[{ label: 'Active', val: stats.active, color: COLORS.info }, { label: 'Pending Docs', val: stats.pending, color: COLORS.warning }, { label: 'Completed', val: stats.completed, color: COLORS.success }].map(s => (
          <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={getListData()}
        keyExtractor={(item, i) => String(item.id || i)}
        renderItem={getRenderItem()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="people-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No {activeTab.toLowerCase()} records</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  statCard: { flex: 1, backgroundColor: COLORS.gray50, borderRadius: 10, padding: 12, alignItems: 'center', borderTopWidth: 3 },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  tabScroll: { backgroundColor: COLORS.white, maxHeight: 50, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tabContainer: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  tabTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardLeft: {},
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 17, fontWeight: '800', color: COLORS.white },
  cardName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  cardSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  cardDate: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 3 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  progressBar: { flex: 1, height: 6, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressPct: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
