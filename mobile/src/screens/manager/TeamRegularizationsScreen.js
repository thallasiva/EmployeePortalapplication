import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const STATUS_COLORS = {
  pending:  { bg: '#fef9c3', text: '#854d0e', label: 'Pending' },
  approved: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
};

const Badge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
};

const Card = ({ item, onApprove, onReject }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>
          {(item.employee_name || item.name || '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.empName}>{item.employee_name || item.name || '—'}</Text>
        <Text style={styles.empDept}>{item.department || item.designation || ''}</Text>
      </View>
      <Badge status={item.status || 'pending'} />
    </View>
    <View style={styles.cardBody}>
      <Row label="Date" value={item.date || item.attendance_date || '—'} />
      <Row label="Punch In" value={item.requested_in || item.punch_in || '—'} />
      <Row label="Punch Out" value={item.requested_out || item.punch_out || '—'} />
      {item.reason && <Row label="Reason" value={item.reason} />}
    </View>
    {(!item.status || item.status === 'pending') && (
      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(item)}>
          <Ionicons name="close" size={16} color={COLORS.danger} />
          <Text style={styles.rejectTxt}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(item)}>
          <Ionicons name="checkmark" size={16} color={COLORS.white} />
          <Text style={styles.approveTxt}>Approve</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

export default function TeamRegularizationsScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    try {
      const res = await client.get('/attendance/regularizations/team', {
        params: { status: filter || undefined },
      });
      const list = res.data?.data ?? res.data ?? [];
      setData(Array.isArray(list) ? list : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleAction = (item, action) => {
    Alert.prompt(
      action === 'approve' ? 'Approve Regularization' : 'Reject Regularization',
      'Add a comment (optional)',
      async (comment) => {
        try {
          await client.put(`/attendance/regularizations/${item.id}/${action}`, { comment });
          load();
        } catch {
          Alert.alert('Error', `Could not ${action} request`);
        }
      },
      'plain-text',
      '',
    );
  };

  const filtered = data.filter(d =>
    (d.employee_name || d.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Team Regularizations</Text>
      </View>

      <View style={styles.filters}>
        {['pending','approved','rejected'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}>
            <Text style={[styles.chipTxt, filter === f && styles.chipTxtActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={COLORS.gray400} />
        <TextInput
          placeholder="Search employee..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor={COLORS.gray400}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <Card
              item={item}
              onApprove={(i) => handleAction(i, 'approve')}
              onReject={(i) => handleAction(i, 'reject')}
            />
          )}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.gray300} />
              <Text style={styles.emptyTxt}>No {filter} regularizations</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  back: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.white },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  chipActive: { backgroundColor: COLORS.primary },
  chipTxt: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  chipTxtActive: { color: COLORS.white },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: COLORS.gray100 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.secondary },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empDept: { fontSize: 12, color: COLORS.gray500 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardBody: { gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 12, color: COLORS.gray500 },
  rowValue: { fontSize: 12, fontWeight: '600', color: COLORS.secondary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.danger + '40', backgroundColor: COLORS.danger + '08' },
  rejectTxt: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.success },
  approveTxt: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTxt: { fontSize: 15, color: COLORS.gray400 },
});
