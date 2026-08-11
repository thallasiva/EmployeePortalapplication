import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { tasksApi } from '../../api/tasks.api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TimesheetsScreen({ navigation }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total_employees: 0, submitted: 0, pending: 0, total_hours: 0 });

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tasksApi.adminAll({ month: month + 1, year: now.getFullYear() });
      setTimesheets(Array.isArray(res) ? res : (res?.timesheets || res?.items || []));
      setSummary(res.data?.summary || {});
    } catch { setTimesheets([]); } finally { setLoading(false); }
  }, [month]);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{(item.employee_name || 'U')[0]}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.empName}>{item.employee_name}</Text>
        <Text style={styles.empDept}>{item.department}</Text>
        <View style={styles.hoursRow}>
          <Ionicons name="time-outline" size={13} color={COLORS.primary} />
          <Text style={styles.hoursText}>{item.total_hours || 0}h / {item.expected_hours || 0}h</Text>
          {item.overtime_hours > 0 && <Text style={styles.otText}>+{item.overtime_hours}h OT</Text>}
        </View>
      </View>
      <View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'submitted' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
          <Text style={[styles.statusText, { color: item.status === 'submitted' ? COLORS.success : COLORS.warning }]}>{item.status || 'Pending'}</Text>
        </View>
        {item.lop_days > 0 && <Text style={styles.lopText}>{item.lop_days}d LOP</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Timesheets</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.statsRow}>
        {[{ label: 'Employees', val: summary.total_employees || timesheets.length, color: COLORS.secondary }, { label: 'Submitted', val: summary.submitted || 0, color: COLORS.success }, { label: 'Pending', val: summary.pending || 0, color: COLORS.warning }, { label: 'Total Hrs', val: `${summary.total_hours || 0}h`, color: COLORS.primary }].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={styles.monthContainer}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={m} onPress={() => setMonth(i)} style={[styles.monthChip, month === i && styles.monthChipActive]}>
            <Text style={[styles.monthText, month === i && styles.monthTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList data={timesheets} keyExtractor={(item, i) => String(item.id || i)} renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTimesheets} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="time-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No timesheets for {MONTHS[month]}</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  statsRow: { flexDirection: 'row', padding: 10, gap: 6, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.gray400, marginTop: 2 },
  monthScroll: { backgroundColor: COLORS.white, maxHeight: 52 },
  monthContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  monthChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  monthChipActive: { backgroundColor: COLORS.primary },
  monthText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  monthTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empDept: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  hoursText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  otText: { fontSize: 11, color: COLORS.success, fontWeight: '700', marginLeft: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignItems: 'center' },
  statusText: { fontSize: 11, fontWeight: '700' },
  lopText: { fontSize: 11, color: COLORS.danger, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
