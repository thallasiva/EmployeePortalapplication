import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, ScrollView, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { attendanceApi } from '../../api/attendance.api';
import client from '../../api/client';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const STATUS_COLORS = {
  present: COLORS.success, late: COLORS.warning,
  absent: COLORS.danger, leave: COLORS.info, 'on leave': COLORS.info,
};
const getStatusColor = (s = '') => STATUS_COLORS[s.toLowerCase()] || COLORS.gray400;

const KpiCard = ({ label, value, color, icon }) => (
  <View style={[styles.kpiCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={18} color={color} style={{ marginBottom: 4 }} />
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

export default function AdminAttendanceScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'regularization'
  const [summary, setSummary] = useState({ total_employees: 0, present_today: 0, absent_today: 0, late_today: 0, on_leave_today: 0 });
  const [employees, setEmployees] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusTab, setStatusTab] = useState('All');
  const [search, setSearch] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // { id, action } | null
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const STATUS_TABS = ['All', 'Present', 'Absent', 'Late', 'On Leave'];

  const loadDashboard = useCallback(async () => {
    try {
      const today = todayStr();
      const [dash, list] = await Promise.all([
        attendanceApi.dashboard().catch(() => ({})),
        attendanceApi.list({ from_date: today, to_date: today, limit: 300 }).catch(() => []),
      ]);
      const d = Array.isArray(dash) ? {} : (dash || {});
      setSummary({
        total_employees: Number(d.total_employees || 0),
        present_today: Number(d.present_today || 0),
        absent_today: Number(d.absent_today || 0),
        late_today: Number(d.late_today || 0),
        on_leave_today: Number(d.on_leave_today || 0),
      });
      const rows = Array.isArray(list) ? list : (list?.data || []);
      setEmployees(rows);
    } catch (e) { console.log('dash err', e?.message); }
  }, []);

  const loadRegularizations = useCallback(async () => {
    try {
      const res = await attendanceApi.regularizations({ status: 'Pending', limit: 100 });
      const rows = Array.isArray(res) ? res : (res?.data || res?.rows || []);
      setRegularizations(rows);
    } catch (e) {
      console.log('reg err', e?.message);
      setRegularizations([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadDashboard(), loadRegularizations()]);
  }, [loadDashboard, loadRegularizations]);

  const fetch = useCallback(async () => { setLoading(true); await loadAll(); setLoading(false); }, [loadAll]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadAll(); setRefreshing(false); }, [loadAll]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleReview = (reg, action) => {
    setReviewModal({ id: reg.regularization_id || reg.id, action });
    setReviewNote('');
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    setReviewing(true);
    try {
      await client.put(`/attendance/regularizations/${reviewModal.id}/review`, {
        status: reviewModal.action === 'approve' ? 'Approved' : 'Rejected',
        remarks: reviewNote,
      });
      Alert.alert('Done', `Request ${reviewModal.action === 'approve' ? 'approved' : 'rejected'}.`);
      setReviewModal(null);
      loadRegularizations();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Action failed.');
    } finally { setReviewing(false); }
  };

  const filteredEmployees = employees.filter(emp => {
    const status = (emp.status || '').toLowerCase();
    const name = (emp.employee_name || emp.full_name || '').toLowerCase();
    const matchTab = statusTab === 'All' ||
      (statusTab === 'Present' && status === 'present') ||
      (statusTab === 'Absent' && status === 'absent') ||
      (statusTab === 'Late' && status === 'late') ||
      (statusTab === 'On Leave' && (status === 'on leave' || status === 'leave'));
    const matchSearch = !search || name.includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const rate = summary.total_employees > 0
    ? Math.round((summary.present_today / summary.total_employees) * 100) : 0;

  const renderEmployee = ({ item }) => {
    const status = item.status || 'unknown';
    const sColor = getStatusColor(status);
    const checkin = item.check_in_time || item.checkin_time || '—';
    const checkout = item.check_out_time || item.checkout_time || '—';
    const hours = item.work_hours || item.hours_worked;
    return (
      <View style={styles.empCard}>
        <View style={styles.empRow}>
          <View style={[styles.statusDot, { backgroundColor: sColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.empName}>{item.employee_name || item.full_name || 'Employee'}</Text>
            <Text style={styles.empDept}>{item.department_name || item.department || ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sColor + '20' }]}>
            <Text style={[styles.statusText, { color: sColor }]}>{status}</Text>
          </View>
        </View>
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Ionicons name="log-in-outline" size={13} color={COLORS.success} />
            <Text style={styles.timeText}>{checkin}</Text>
          </View>
          <View style={styles.timeItem}>
            <Ionicons name="log-out-outline" size={13} color={COLORS.danger} />
            <Text style={styles.timeText}>{checkout}</Text>
          </View>
          {hours != null && (
            <View style={styles.timeItem}>
              <Ionicons name="time-outline" size={13} color={COLORS.info} />
              <Text style={styles.timeText}>{typeof hours === 'number' ? hours.toFixed(1) : hours}h</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderRegularization = ({ item }) => (
    <View style={styles.regCard}>
      <View style={styles.regTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.regName}>{item.employee_name || item.full_name || 'Employee'}</Text>
          <Text style={styles.regDate}>{item.attendance_date || item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.warning + '20' }]}>
          <Text style={[styles.statusText, { color: COLORS.warning }]}>Pending</Text>
        </View>
      </View>
      <Text style={styles.regReason} numberOfLines={2}>{item.reason || item.remarks || 'No reason provided'}</Text>
      <View style={styles.regTimes}>
        {item.requested_check_in && (
          <Text style={styles.regTimeText}>Check-in: {item.requested_check_in}</Text>
        )}
        {item.requested_check_out && (
          <Text style={styles.regTimeText}>Check-out: {item.requested_check_out}</Text>
        )}
      </View>
      <View style={styles.regActions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReview(item, 'reject')}>
          <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} onPress={() => handleReview(item, 'approve')}>
          <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Attendance</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <Ionicons name="refresh-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* KPI Summary */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll} contentContainerStyle={styles.kpiRow}>
        <KpiCard label="Total" value={summary.total_employees} color={COLORS.secondary} icon="people-outline" />
        <KpiCard label="Present" value={summary.present_today} color={COLORS.success} icon="checkmark-circle-outline" />
        <KpiCard label="Absent" value={summary.absent_today} color={COLORS.danger} icon="close-circle-outline" />
        <KpiCard label="Late" value={summary.late_today} color={COLORS.warning} icon="time-outline" />
        <KpiCard label="On Leave" value={summary.on_leave_today} color={COLORS.info} icon="calendar-outline" />
        <KpiCard label="Rate%" value={`${rate}%`} color={COLORS.primary} icon="stats-chart-outline" />
      </ScrollView>

      {/* Tab: Today | Regularizations */}
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setActiveTab('today')} style={[styles.tab, activeTab === 'today' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('regularization')} style={[styles.tab, activeTab === 'regularization' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'regularization' && styles.tabTextActive]}>
            Regularizations {regularizations.length > 0 ? `(${regularizations.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'today' ? (
        <>
          {/* Status filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
            {STATUS_TABS.map(t => (
              <TouchableOpacity key={t} onPress={() => setStatusTab(t)} style={[styles.chip, statusTab === t && styles.chipActive]}>
                <Text style={[styles.chipText, statusTab === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={COLORS.gray400} style={{ marginRight: 6 }} />
            <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search employee..." placeholderTextColor={COLORS.gray300} />
          </View>
          <FlatList
            data={filteredEmployees}
            keyExtractor={(item, i) => String(item.attendance_id || item.employee_id || i)}
            renderItem={renderEmployee}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="people-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No records found</Text></View>}
          />
        </>
      ) : (
        <FlatList
          data={regularizations}
          keyExtractor={(item, i) => String(item.regularization_id || item.id || i)}
          renderItem={renderRegularization}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={!loading && (
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.gray300} />
              <Text style={styles.emptyText}>No pending regularizations</Text>
            </View>
          )}
        />
      )}
      {loading && <ActivityIndicator color={COLORS.primary} style={{ position: 'absolute', top: '50%', alignSelf: 'center' }} />}

      {/* Review Modal */}
      <Modal visible={!!reviewModal} transparent animationType="fade" onRequestClose={() => setReviewModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {reviewModal?.action === 'approve' ? '✅ Approve Request' : '❌ Reject Request'}
            </Text>
            <Text style={styles.modalSubtitle}>Add a remark (optional)</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 70 }]}
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder="Enter remarks..."
              placeholderTextColor={COLORS.gray300}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReviewModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: reviewModal?.action === 'approve' ? COLORS.success : COLORS.danger }]}
                onPress={submitReview} disabled={reviewing}>
                {reviewing ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.confirmText}>{reviewModal?.action === 'approve' ? 'Approve' : 'Reject'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  kpiScroll: { maxHeight: 90, backgroundColor: COLORS.white },
  kpiRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 10, flexDirection: 'row' },
  kpiCard: { width: 80, backgroundColor: COLORS.background, borderRadius: 10, padding: 10, borderLeftWidth: 3, alignItems: 'center' },
  kpiValue: { fontSize: 18, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: COLORS.gray500, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  tabTextActive: { color: COLORS.primary },
  chipScroll: { maxHeight: 48, backgroundColor: COLORS.white },
  chipRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: COLORS.gray100 },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
  chipTextActive: { color: COLORS.white },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 12, marginVertical: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.gray200 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.secondary },
  list: { padding: 12, gap: 10, paddingBottom: 40 },
  empCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empDept: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  timeRow: { flexDirection: 'row', gap: 16 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: COLORS.gray500, fontWeight: '600' },
  // Regularization
  regCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  regTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  regName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  regDate: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  regReason: { fontSize: 13, color: COLORS.gray500, marginBottom: 8 },
  regTimes: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  regTimeText: { fontSize: 12, color: COLORS.gray500, fontWeight: '600' },
  regActions: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.danger + '50', backgroundColor: COLORS.danger + '10' },
  rejectText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.success },
  approveText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: COLORS.gray500, marginBottom: 12 },
  modalInput: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.gray200, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: COLORS.gray500 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  confirmText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
