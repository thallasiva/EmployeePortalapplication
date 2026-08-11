import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { appraisalApi } from '../../api/appraisal.api';

const TABS = ['Overview', 'Cycles', 'Ratings'];

export default function PerformanceAdminScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState({ cycles: [], ratings: [], stats: {} });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [cyclesRes, statsRes] = await Promise.all([
        appraisalApi.cycles(),
        appraisalApi.all(),
      ]);
      setData({ cycles: cyclesRes.data?.cycles || cyclesRes.data || [], ratings: statsRes.data?.ratings || [], stats: statsRes.data?.summary || statsRes.data || {} });
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const getRatingColor = (r, max = 5) => { const p = r / max; return p >= 0.8 ? COLORS.success : p >= 0.6 ? COLORS.warning : COLORS.danger; };

  const renderOverview = () => (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Employees', val: data.stats.total_employees || 0, icon: 'people-outline', color: COLORS.secondary },
          { label: 'Reviewed', val: data.stats.reviewed || 0, icon: 'checkmark-circle-outline', color: COLORS.success },
          { label: 'Pending', val: data.stats.pending || 0, icon: 'time-outline', color: COLORS.warning },
          { label: 'Avg Rating', val: data.stats.avg_rating ? `${Number(data.stats.avg_rating).toFixed(1)}/5` : '—', icon: 'star-outline', color: COLORS.primary },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}><Ionicons name={s.icon} size={20} color={s.color} /></View>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      {data.ratings.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rating Distribution</Text>
          {[5,4,3,2,1].map(r => {
            const count = data.ratings.filter(e => Math.round(e.rating) === r).length;
            const pct = data.ratings.length > 0 ? count / data.ratings.length : 0;
            return (
              <View key={r} style={styles.distRow}>
                <Text style={styles.distStar}>{r}★</Text>
                <View style={styles.distBar}><View style={[styles.distFill, { width: `${pct * 100}%`, backgroundColor: getRatingColor(r) }]} /></View>
                <Text style={styles.distCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  const renderCycles = () => (
    <FlatList data={data.cycles} keyExtractor={(item, i) => String(item.id || i)} contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{item.cycle_name || item.name}</Text>
            <View style={[styles.badge, { backgroundColor: item.status === 'active' ? COLORS.success + '20' : COLORS.gray200 }]}>
              <Text style={[styles.badgeText, { color: item.status === 'active' ? COLORS.success : COLORS.gray500 }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>{item.start_date} → {item.end_date}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${item.completion_pct || 0}%` }]} /></View>
            <Text style={styles.progressPct}>{item.completion_pct || 0}% complete</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="ribbon-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No cycles found</Text></View>}
    />
  );

  const renderRatings = () => (
    <FlatList data={data.ratings} keyExtractor={(item, i) => String(item.id || i)} contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.ratingCard}>
          <View style={styles.rAvatar}><Text style={styles.rAvatarText}>{(item.employee_name || 'U')[0]}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rName}>{item.employee_name}</Text>
            <Text style={styles.rDept}>{item.department}</Text>
          </View>
          <View style={[styles.ratingBubble, { backgroundColor: getRatingColor(item.rating) + '20' }]}>
            <Text style={[styles.ratingVal, { color: getRatingColor(item.rating) }]}>{Number(item.rating).toFixed(1)}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={!loading && <View style={styles.empty}><Text style={styles.emptyText}>No ratings yet</Text></View>}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Performance</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flex: 1 }}>
        {activeTab === 'Overview' ? renderOverview() : activeTab === 'Cycles' ? renderCycles() : renderRatings()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 12, color: COLORS.gray500, textAlign: 'center' },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, flex: 1 },
  cardSub: { fontSize: 12, color: COLORS.gray400, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressPct: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  distStar: { fontSize: 13, color: COLORS.gray600, width: 28, fontWeight: '600' },
  distBar: { flex: 1, height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 4 },
  distCount: { fontSize: 12, color: COLORS.gray500, width: 24, textAlign: 'right' },
  list: { padding: 16, gap: 10 },
  ratingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  rAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  rAvatarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  rName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  rDept: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  ratingBubble: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  ratingVal: { fontSize: 17, fontWeight: '900' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
