import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentApi } from '../../api/recruitment.api';
import { COLORS, SHADOW } from '../../constants/colors';
import { formatDate } from '../../utils/formatters';
import SearchBar from '../../components/common/SearchBar';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';

const STATUS_VARIANT = { Open: 'success', Closed: 'danger', 'On Hold': 'warning', Draft: 'gray' };

export default function RecruitmentScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, candidates: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('jobs');

  const fetchData = useCallback(async () => {
    try {
      const res = await recruitmentApi.jobs({ limit: 100 });
      const data = Array.isArray(res) ? res : res?.data || res?.jobs || [];
      setJobs(data);
      setFiltered(data);
      setStats({ total: data.length, open: data.filter(j => j.status === 'Open').length, candidates: 0 });
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(jobs); return; }
    const q = search.toLowerCase();
    setFiltered(jobs.filter(j => j.title?.toLowerCase().includes(q) || j.department_name?.toLowerCase().includes(q)));
  }, [search, jobs]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const renderJob = ({ item }) => (
    <TouchableOpacity style={[styles.jobCard, SHADOW.small]} activeOpacity={0.8} onPress={() => navigation.navigate('JobDetail', { jobId: item.job_id || item.id })}>
      <View style={styles.jobTop}>
        <View style={styles.jobTitleRow}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.title || item.job_title}</Text>
          <Badge label={item.status || 'Open'} variant={STATUS_VARIANT[item.status] || 'success'} />
        </View>
        <Text style={styles.jobDept}>{item.department_name || item.department} · {item.location || 'Office'}</Text>
      </View>
      <View style={styles.jobMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={13} color={COLORS.gray400} />
          <Text style={styles.metaText}>{item.vacancies || item.openings || 1} opening{(item.vacancies || 1) > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.gray400} />
          <Text style={styles.metaText}>Posted {formatDate(item.posted_on || item.created_at)}</Text>
        </View>
        {item.experience && (
          <View style={styles.metaItem}>
            <Ionicons name="briefcase-outline" size={13} color={COLORS.gray400} />
            <Text style={styles.metaText}>{item.experience}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.viewCandidatesBtn} onPress={() => navigation.navigate('Candidates', { jobId: item.job_id || item.id, jobTitle: item.title })}>
        <Text style={styles.viewCandidatesText}>View Candidates</Text>
        <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recruitment</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total Jobs', value: stats.total, icon: 'briefcase-outline', color: COLORS.primary },
          { label: 'Open', value: stats.open, icon: 'checkmark-circle-outline', color: COLORS.success },
          { label: 'Candidates', value: stats.candidates, icon: 'people-outline', color: '#7c3aed' },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, SHADOW.small]}>
            <Ionicons name={s.icon} size={18} color={s.color} style={{ marginBottom: 6 }} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search jobs…" />
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => String(item.job_id || item.id || i)}
          renderItem={renderJob}
          contentContainerStyle={{ padding: 16, paddingBottom: 120, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No jobs found" subtitle="No open positions at the moment" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray100 },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  jobCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.gray100 },
  jobTop: { marginBottom: 10 },
  jobTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  jobDept: { fontSize: 12, color: COLORS.textMuted },
  jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.gray500 },
  viewCandidatesBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 12 },
  viewCandidatesText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
