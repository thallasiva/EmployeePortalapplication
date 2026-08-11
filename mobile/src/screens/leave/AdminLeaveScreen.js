import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { leaveApi } from '../../api/leave.api';

const TABS = ['Requests', 'Balances', 'Types'];
const STATUS_CHIPS = [
  { key: 'Pending', color: COLORS.warning },
  { key: 'Approved', color: COLORS.success },
  { key: 'Rejected', color: COLORS.danger },
];

const statusColor = s => {
  const m = { Pending: COLORS.warning, Approved: COLORS.success, Rejected: COLORS.danger, Cancelled: COLORS.gray400 };
  return m[s] || COLORS.gray400;
};

const fmtDate = (s) => {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return s; }
};

export default function AdminLeaveScreen({ navigation }) {
  const [tab, setTab] = useState('Requests');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved_today: 0, on_leave: 0 });

  const loadRequests = useCallback(async () => {
    const [pending, all] = await Promise.all([
      leaveApi.list({ status: 'Pending', limit: 200 }).catch(() => []),
      leaveApi.list({ status: statusFilter, limit: 200 }).catch(() => []),
    ]);
    const pendingArr = Array.isArray(pending) ? pending : pending?.data || [];
    const allArr = Array.isArray(all) ? all : all?.data || [];
    setStats(s => ({ ...s, pending: pendingArr.length }));
    setRequests(allArr);
  }, [statusFilter]);

  const loadBalances = useCallback(async () => {
    const res = await leaveApi.adminBalances({ limit: 500 }).catch(() => []);
    setBalances(Array.isArray(res) ? res : res?.data || []);
  }, []);

  const loadTypes = useCallback(async () => {
    const res = await leaveApi.types().catch(() => []);
    setLeaveTypes(Array.isArray(res) ? res : res?.data || []);
  }, []);

  const load = useCallback(async () => {
    try {
      if (tab === 'Requests') await loadRequests();
      if (tab === 'Balances') await loadBalances();
      if (tab === 'Types') await loadTypes();
    } catch (e) { console.log('AdminLeave error', e?.message); }
  }, [tab, loadRequests, loadBalances, loadTypes]);

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

  const handleAction = async (decision) => {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      await leaveApi.review(actionModal.leave_request_id || actionModal.id, { decision: decision.toLowerCase(), remarks });
      Alert.alert('Done', `Leave request ${decision.toLowerCase()}d successfully.`);
      setActionModal(null);
      setRemarks('');
      loadRequests();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Action failed. Try again.');
    } finally { setSubmitting(false); }
  };

  const filteredRequests = requests.filter(r => {
    const name = (r.employee_name || r.full_name || '').toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  const renderRequest = ({ item }) => {
    const sColor = statusColor(item.status);
    return (
      <TouchableOpacity style={styles.card} onPress={() => item.status === 'Pending' && setActionModal(item)}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.employee_name || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.empName}>{item.employee_name || 'Employee'}</Text>
            <Text style={styles.empSub}>{item.leave_type_name || item.leave_type || 'Leave'} · {item.days || item.no_of_days || 0} day{(item.days || 1) !== 1 ? 's' : ''}</Text>
            <Text style={styles.dateRange}>{fmtDate(item.from_date || item.start_date)} → {fmtDate(item.to_date || item.end_date)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sColor + '18' }]}>
            <Text style={[styles.badgeText, { color: sColor }]}>{item.status}</Text>
          </View>
        </View>
        {item.reason && (
          <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
        )}
        {item.status === 'Pending' && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success + '15', borderColor: COLORS.success + '40' }]}
              onPress={() => { setActionModal(item); }}>
              <Ionicons name="checkmark" size={14} color={COLORS.success} />
              <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger + '40' }]}
              onPress={() => { setActionModal({ ...item, _autoDecision: 'reject' }); }}>
              <Ionicons name="close" size={14} color={COLORS.danger} />
              <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBalance = ({ item }) => (
    <View style={styles.balanceCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.employee_name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.empName}>{item.employee_name || 'Employee'}</Text>
          <Text style={styles.empSub}>{item.department_name || ''}</Text>
        </View>
      </View>
      <View style={styles.balanceRow}>
        {[
          { label: item.leave_type_name || 'Leave', avail: item.balance, used: item.availed },
        ].map((b, i) => (
          <View key={i} style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>{b.label}</Text>
            <View style={styles.balanceBar}>
              <View style={[styles.balanceFill, { flex: b.avail || 0, backgroundColor: COLORS.primary }]} />
              <View style={[styles.balanceFill, { flex: b.used || 0, backgroundColor: COLORS.danger }]} />
            </View>
            <Text style={styles.balanceSub}>{b.avail || 0} left · {b.used || 0} used</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderType = ({ item }) => (
    <View style={styles.typeCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={[styles.typeIcon, { backgroundColor: COLORS.primary + '15' }]}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.empName}>{item.leave_type_name || item.name}</Text>
          <Text style={styles.empSub}>{item.description || ''}</Text>
        </View>
        <View style={styles.typeAllowance}>
          <Text style={styles.typeAllowanceNum}>{item.max_days_allowed || item.days_allowed || 0}</Text>
          <Text style={styles.typeAllowanceLabel}>days/yr</Text>
        </View>
      </View>
      <View style={styles.typeMeta}>
        {item.is_paid !== undefined && (
          <View style={[styles.metaChip, { backgroundColor: item.is_paid ? COLORS.success + '15' : COLORS.gray100 }]}>
            <Text style={[styles.metaChipText, { color: item.is_paid ? COLORS.success : COLORS.gray500 }]}>{item.is_paid ? 'Paid' : 'Unpaid'}</Text>
          </View>
        )}
        {item.carry_forward !== undefined && (
          <View style={[styles.metaChip, { backgroundColor: item.carry_forward ? COLORS.info + '15' : COLORS.gray100 }]}>
            <Text style={[styles.metaChipText, { color: item.carry_forward ? COLORS.info : COLORS.gray500 }]}>{item.carry_forward ? 'Carry Forward' : 'No CF'}</Text>
          </View>
        )}
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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Leave Management</Text>
          <Text style={styles.subtitle}>Approve · Balances · Leave Types</Text>
        </View>
        {stats.pending > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{stats.pending} pending</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Requests' && (
        <View style={{ flex: 1 }}>
          {/* Status filter + Search */}
          <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {STATUS_CHIPS.map(s => (
                <TouchableOpacity key={s.key} onPress={() => setStatusFilter(s.key)}
                  style={[styles.statusChip, statusFilter === s.key && { backgroundColor: s.color, borderColor: s.color }]}>
                  <Text style={[styles.statusChipText, statusFilter === s.key && { color: COLORS.white }]}>{s.key}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={COLORS.gray300} />
              <TextInput style={styles.searchInput} placeholder="Search employee…" placeholderTextColor={COLORS.gray300} value={search} onChangeText={setSearch} />
            </View>
          </View>
          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
          ) : (
            <FlatList
              data={filteredRequests}
              keyExtractor={(item, i) => String(item.leave_request_id || item.id || i)}
              renderItem={renderRequest}
              contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
              ListEmptyComponent={() => (
                <View style={styles.empty}>
                  <Ionicons name="calendar-outline" size={48} color={COLORS.gray200} />
                  <Text style={styles.emptyTitle}>No {statusFilter.toLowerCase()} requests</Text>
                </View>
              )}
            />
          )}
        </View>
      )}

      {tab === 'Balances' && (
        loading ? <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View> :
        <FlatList
          data={balances}
          keyExtractor={(item, i) => String(item.employee_id || i)}
          renderItem={renderBalance}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={() => <View style={styles.empty}><Ionicons name="albums-outline" size={48} color={COLORS.gray200} /><Text style={styles.emptyTitle}>No balance data</Text></View>}
        />
      )}

      {tab === 'Types' && (
        loading ? <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View> :
        <FlatList
          data={leaveTypes}
          keyExtractor={(item, i) => String(item.leave_type_id || i)}
          renderItem={renderType}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={() => <View style={styles.empty}><Ionicons name="list-outline" size={48} color={COLORS.gray200} /><Text style={styles.emptyTitle}>No leave types</Text></View>}
        />
      )}

      {/* Action Modal */}
      <Modal visible={!!actionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Review Leave Request</Text>
            {actionModal && (
              <View style={{ gap: 4, marginBottom: 16 }}>
                <Text style={styles.modalEmpName}>{actionModal.employee_name}</Text>
                <Text style={styles.modalSub}>{actionModal.leave_type_name} · {actionModal.days || actionModal.no_of_days || 0} days</Text>
                <Text style={styles.modalSub}>{fmtDate(actionModal.from_date || actionModal.start_date)} → {fmtDate(actionModal.to_date || actionModal.end_date)}</Text>
                {actionModal.reason && <Text style={styles.modalReason}>{actionModal.reason}</Text>}
              </View>
            )}
            <Text style={styles.modalLabel}>Remarks (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Add remarks…"
              placeholderTextColor={COLORS.gray300}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setActionModal(null); setRemarks(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: COLORS.danger, flex: 1 }]}
                onPress={() => handleAction('reject')} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.modalActionText}>Reject</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: COLORS.success, flex: 1 }]}
                onPress={() => handleAction('approve')} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.modalActionText}>Approve</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  subtitle: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  pendingBadge: { backgroundColor: COLORS.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.warning },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: COLORS.primary },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.gray400 },
  tabBtnTextActive: { color: COLORS.primary, fontWeight: '800' },
  statusChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 },
  statusChipText: { fontSize: 12, fontWeight: '700', color: COLORS.gray500 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: COLORS.gray100 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.secondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, gap: 8 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empSub: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  dateRange: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  reason: { fontSize: 12, color: COLORS.gray500, fontStyle: 'italic', paddingLeft: 50 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  balanceCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, gap: 10 },
  balanceRow: { gap: 6 },
  balanceItem: { gap: 3 },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceBar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: COLORS.gray100 },
  balanceFill: { height: 6 },
  balanceSub: { fontSize: 11, color: COLORS.gray400 },
  typeCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, gap: 8 },
  typeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeAllowance: { alignItems: 'center' },
  typeAllowanceNum: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  typeAllowanceLabel: { fontSize: 10, color: COLORS.gray400, fontWeight: '600' },
  typeMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  metaChipText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray400 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary, marginBottom: 16 },
  modalEmpName: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  modalSub: { fontSize: 13, color: COLORS.gray400 },
  modalReason: { fontSize: 13, color: COLORS.gray500, fontStyle: 'italic', marginTop: 4 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, marginBottom: 6 },
  modalInput: { backgroundColor: COLORS.gray50, borderWidth: 1.5, borderColor: COLORS.gray100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.secondary, minHeight: 80, textAlignVertical: 'top' },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.gray200 },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: COLORS.gray600 },
  modalActionBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  modalActionText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
