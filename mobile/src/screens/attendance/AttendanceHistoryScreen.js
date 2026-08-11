import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { attendanceApi } from '../../api/attendance.api';
import { formatDate } from '../../utils/formatters';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AttendanceHistoryScreen({ navigation }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, wfh: 0, working_days: 0 });
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.myHistory({ month: selectedMonth + 1, year: selectedYear });
      const records = Array.isArray(res) ? res : (res?.records || res?.items || []);
      const summaryData = res?.summary || {};
      setRecords(records);
      setSummary({ present: 0, absent: 0, late: 0, wfh: 0, working_days: 0, ...summaryData });
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return COLORS.success;
      case 'absent': return COLORS.danger;
      case 'late': return COLORS.warning;
      case 'wfh': return COLORS.info;
      case 'half_day': return '#8b5cf6';
      case 'holiday': return COLORS.gray400;
      default: return COLORS.gray300;
    }
  };

  const getStatusLabel = (status) => {
    const map = { present: 'Present', absent: 'Absent', late: 'Late', wfh: 'WFH', half_day: 'Half Day', holiday: 'Holiday', weekend: 'Weekend' };
    return map[status] || status;
  };

  const renderRecord = ({ item }) => (
    <View style={styles.recordRow}>
      <View style={styles.dateCol}>
        <Text style={styles.dateNum}>{new Date(item.attendance_date || item.date).getDate()}</Text>
        <Text style={styles.dateMon}>{MONTHS[new Date(item.attendance_date || item.date).getMonth()]}</Text>
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.recordDay}>{new Date(item.attendance_date || item.date).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
        <Text style={styles.recordTime}>
          {item.check_in ? `In: ${item.check_in}` : '—'}{item.check_out ? `  Out: ${item.check_out}` : ''}
        </Text>
        {item.work_hours ? <Text style={styles.recordHours}>{item.work_hours}h worked</Text> : null}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {getStatusLabel(item.status)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Month Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={styles.monthContainer}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity
            key={m}
            onPress={() => setSelectedMonth(i)}
            style={[styles.monthChip, selectedMonth === i && styles.monthChipActive]}
          >
            <Text style={[styles.monthText, selectedMonth === i && styles.monthTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Present', val: summary.present, color: COLORS.success },
          { label: 'Absent', val: summary.absent, color: COLORS.danger },
          { label: 'Late', val: summary.late, color: COLORS.warning },
          { label: 'WFH', val: summary.wfh, color: COLORS.info },
        ].map(s => (
          <View key={s.label} style={[styles.summaryCard, { borderTopColor: s.color }]}>
            <Text style={[styles.summaryVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Records */}
      <FlatList
        data={records}
        keyExtractor={(item, i) => String(i)}
        renderItem={renderRecord}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.gray300} />
              <Text style={styles.emptyText}>No records for {MONTHS[selectedMonth]} {selectedYear}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  monthScroll: { maxHeight: 56, backgroundColor: COLORS.white },
  monthContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  monthChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  monthChipActive: { backgroundColor: COLORS.primary },
  monthText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  monthTextActive: { color: COLORS.white },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 10, padding: 10, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  summaryVal: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  recordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 8, padding: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  dateCol: { width: 44, alignItems: 'center', marginRight: 12 },
  dateNum: { fontSize: 20, fontWeight: '800', color: COLORS.secondary },
  dateMon: { fontSize: 11, color: COLORS.gray500, fontWeight: '600' },
  recordInfo: { flex: 1 },
  recordDay: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  recordTime: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  recordHours: { fontSize: 11, color: COLORS.primary, marginTop: 2, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
