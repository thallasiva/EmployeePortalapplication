import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { leaveApi } from '../../api/leave.api';
import * as Haptics from 'expo-haptics';

const STATUS_FILTERS = ['pending', 'approved', 'rejected'];

export default function LeaveApprovalScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionModal, setActionModal] = useState(null); // { request, action }
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveApi.list({ status: filter });
      setRequests(Array.isArray(res) ? res : (res?.items || res?.requests || []));
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      await leaveApi.review(actionModal.request.id, { decision: actionModal.action, remarks });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Done', `Leave request ${actionModal.action}.`);
      setActionModal(null);
      setRemarks('');
      fetchRequests();
    } catch {
      Alert.alert('Error', 'Action failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeColor = (type) => {
    const map = { annual: COLORS.primary, sick: COLORS.danger, casual: COLORS.info, unpaid: COLORS.gray500, maternity: '#8b5cf6', paternity: '#06b6d4' };
    return map[(type || '').toLowerCase()] || COLORS.primary;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('LeaveDetail', { leaveId: item.leave_request_id || item.id, isManager: true })}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.employee_name || item.full_name || 'Employee' || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.empName}>{item.employee_name || item.full_name || 'Employee'}</Text>
          <Text style={styles.empDesig}>{item.designation || item.department}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.leave_type) + '20' }]}>
          <Text style={[styles.typeText, { color: getTypeColor(item.leave_type) }]}>{item.leave_type}</Text>
        </View>
      </View>
      <View style={styles.datesRow}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.gray400} />
        <Text style={styles.datesText}>{item.from_date} → {item.to_date}</Text>
        <Text style={styles.daysText}>{item.days || item.total_days} day(s)</Text>
      </View>
      {item.reason ? <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text> : null}
      {filter === 'pending' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => { setActionModal({ request: item, action: 'rejected' }); Haptics.selectionAsync(); }}>
            <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveBtn} onPress={() => { setActionModal({ request: item, action: 'approved' }); Haptics.selectionAsync(); }}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Approvals</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterChip, filter === f && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        keyExtractor={item => String(item.leave_request_id || item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRequests} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={48} color={COLORS.gray300} />
            <Text style={styles.emptyText}>No {filter} requests</Text>
          </View>
        )}
      />

      {/* Action Modal */}
      <Modal visible={!!actionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{actionModal?.action === 'approved' ? '✅ Approve' : '❌ Reject'} Leave</Text>
            <Text style={styles.modalSub}>{actionModal?.request?.employee_name} · {actionModal?.request?.leave_type}</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Remarks (optional)"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.gray400}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => { setActionModal(null); setRemarks(''); }}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: actionModal?.action === 'approved' ? COLORS.success : COLORS.danger }]}
                onPress={handleAction} disabled={submitting}
              >
                {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.confirmText}>Confirm</Text>}
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
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: COLORS.white },
  filterChip: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.gray100, alignItems: 'center' },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  filterTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empDesig: { fontSize: 12, color: COLORS.gray400 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeText: { fontSize: 11, fontWeight: '700' },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  datesText: { fontSize: 13, color: COLORS.gray600, flex: 1 },
  daysText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  reason: { fontSize: 13, color: COLORS.gray500, marginBottom: 10, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.danger, gap: 6 },
  rejectText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.success, gap: 6 },
  approveText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.gray500, marginBottom: 16 },
  remarksInput: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelModalBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.gray100, alignItems: 'center' },
  cancelModalText: { fontSize: 14, fontWeight: '700', color: COLORS.gray600 },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
