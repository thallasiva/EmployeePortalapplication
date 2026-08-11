import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { resignationsApi } from '../../api/resignations.api';
import { timeAgo } from '../../utils/formatters';

const STATUS_COLORS = { pending: COLORS.warning, approved: COLORS.success, rejected: COLORS.danger, withdrawn: COLORS.gray400, notice_period: COLORS.info };
const FILTERS = ['all', 'pending', 'approved', 'notice_period'];

export default function ResignationsScreen({ navigation }) {
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchResignations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await resignationsApi.all({ status: filter === 'all' ? undefined : filter });
      setResignations(res.data?.resignations || res.data || []);
    } catch { setResignations([]); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchResignations(); }, [fetchResignations]);

  const handleAction = async (action) => {
    setSaving(true);
    try {
      await resignationsApi.adminReview(selected.id, { status: action, remarks });
      Alert.alert('Done', `Resignation ${action}.`);
      setSelected(null);
      fetchResignations();
    } catch { Alert.alert('Error', 'Action failed.'); } finally { setSaving(false); }
  };

  const renderItem = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || COLORS.gray400;
    const noticeDays = item.notice_period_days || item.notice_period || 30;
    const lwd = item.last_working_date || item.lwd;
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ResignationDetail', { resignationId: item.id || item.resignation_id })}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(item.employee_name || 'U')[0]}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.empName}>{item.employee_name}</Text>
            <Text style={styles.empSub}>{item.designation} · {item.department}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{(item.status || '').replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Resign Date</Text>
            <Text style={styles.infoVal}>{item.resignation_date || item.created_at?.slice(0,10)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Working Day</Text>
            <Text style={[styles.infoVal, { color: COLORS.danger }]}>{lwd || '—'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Notice Period</Text>
            <Text style={styles.infoVal}>{noticeDays} days</Text>
          </View>
        </View>
        {item.reason && <Text style={styles.reason} numberOfLines={2}>"{item.reason}"</Text>}
        <Text style={styles.timeAgo}>{timeAgo(item.created_at)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Resignations</Text>
        <Text style={styles.count}>{resignations.length}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList data={resignations} keyExtractor={(item, i) => String(item.id || i)} renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchResignations} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="exit-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No {filter} resignations</Text></View>}
      />
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.employee_name}</Text>
            <Text style={styles.modalSub}>{selected?.designation} · Notice: {selected?.notice_period_days || 30} days</Text>
            {selected?.reason && <View style={styles.reasonBox}><Text style={styles.reasonBoxText}>{selected.reason}</Text></View>}
            <TextInput style={styles.remarksInput} placeholder="Remarks..." value={remarks} onChangeText={setRemarks} multiline numberOfLines={2} placeholderTextColor={COLORS.gray300} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)}><Text style={styles.cancelText}>Close</Text></TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction('rejected')} disabled={saving}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction('approved')} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.approveText}>Accept</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  count: { fontSize: 13, color: COLORS.gray400, fontWeight: '600' },
  filterScroll: { backgroundColor: COLORS.white, maxHeight: 52 },
  filterContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  chipTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.danger + 'aa', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 10, color: COLORS.gray400, fontWeight: '600', marginBottom: 2 },
  infoVal: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },
  reason: { fontSize: 13, color: COLORS.gray500, fontStyle: 'italic', marginTop: 4 },
  timeAgo: { fontSize: 11, color: COLORS.gray300, marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.gray500, marginBottom: 12 },
  reasonBox: { backgroundColor: COLORS.gray50, borderRadius: 8, padding: 10, marginBottom: 12 },
  reasonBoxText: { fontSize: 13, color: COLORS.gray600, fontStyle: 'italic' },
  remarksInput: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 10, fontSize: 14, color: COLORS.secondary, marginBottom: 16, minHeight: 60 },
  modalActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.gray100, alignItems: 'center' },
  cancelText: { fontSize: 13, fontWeight: '700', color: COLORS.gray600 },
  rejectBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.danger + '20', alignItems: 'center' },
  rejectText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
  approveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },
  approveText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
});
