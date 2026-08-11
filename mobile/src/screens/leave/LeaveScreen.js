import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { leaveApi } from '../../api/leave.api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOW } from '../../constants/colors';
import { formatDate } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../constants/routes';

const STATUS_VARIANT = { approved: 'success', rejected: 'danger', pending: 'warning', cancelled: 'gray' };

export default function LeaveScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { canManage } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('my'); // 'my' | 'team'

  const fetchData = useCallback(async () => {
    try {
      const [leavesRes, balanceRes] = await Promise.allSettled([
        tab === 'team' ? leaveApi.teamLeaves({ limit: 50 }) : leaveApi.myLeaves({ limit: 50 }),
        leaveApi.balance(),
      ]);
      if (leavesRes.status === 'fulfilled') {
        const data = leavesRes.value;
        setLeaves(Array.isArray(data) ? data : data?.data || data?.leaves || []);
      }
      if (balanceRes.status === 'fulfilled') setBalance(balanceRes.value);
    } catch (_) {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.leaveCard, SHADOW.small]}
      onPress={() => navigation.navigate(ROUTES.LEAVE_DETAIL, { leave: item })}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <View style={[styles.typeTag, { backgroundColor: COLORS.primaryLight }]}>
          <Text style={[styles.typeText, { color: COLORS.primary }]}>{item.leave_type_name || item.type || 'Leave'}</Text>
        </View>
        <Badge label={item.status?.toUpperCase() || 'PENDING'} variant={STATUS_VARIANT[item.status] || 'gray'} />
      </View>
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.gray400} />
        <Text style={styles.dateText}>
          {formatDate(item.from_date || item.start_date)} — {formatDate(item.to_date || item.end_date)}
        </Text>
        <Text style={styles.daysText}>({item.days || item.no_of_days || 1} day{(item.days || item.no_of_days || 1) > 1 ? 's' : ''})</Text>
      </View>
      {item.reason && <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leave Management</Text>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => navigation.navigate(ROUTES.LEAVE_APPLY)}
        >
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Cards */}
      {balance && (
        <View style={styles.balanceRow}>
          {[
            { label: 'Annual', value: (Array.isArray(balance) ? (balance.find(b=>/annual/i.test(b.leave_type_name))?.balance ?? '—') : (balance?.annual ?? '—')), color: COLORS.success },
            { label: 'Sick',   value: (Array.isArray(balance) ? (balance.find(b=>/sick/i.test(b.leave_type_name))?.balance   ?? '—') : (balance?.sick   ?? '—')), color: COLORS.info },
            { label: 'Casual', value: (Array.isArray(balance) ? (balance.find(b=>/casual/i.test(b.leave_type_name))?.balance ?? '—') : (balance?.casual ?? '—')), color: COLORS.warning },
          ].map(b => (
            <View key={b.label} style={[styles.balanceCard, SHADOW.small]}>
              <Text style={[styles.balanceValue, { color: b.color }]}>{b.value}</Text>
              <Text style={styles.balanceLabel}>{b.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tabs */}
      {canManage && (
        <View style={styles.tabs}>
          {['my', 'team'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.activeTab]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
                {t === 'my' ? 'My Leaves' : 'Team Leaves'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={leaves}
          keyExtractor={(item, i) => String(item.leave_request_id || item.id || i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 120, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="No leaves found" subtitle="You haven't applied for any leave yet" action="Apply Leave" onAction={() => navigation.navigate(ROUTES.LEAVE_APPLY)} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Pending Approvals (for managers) */}
      {canManage && (
        <TouchableOpacity
          style={styles.approvalFab}
          onPress={() => navigation.navigate(ROUTES.LEAVE_APPROVAL)}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.white} />
          <Text style={styles.fabText}>Pending Approvals</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  applyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  applyBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  balanceRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  balanceCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray100 },
  balanceValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  balanceLabel: { fontSize: 11, color: COLORS.textMuted },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, backgroundColor: COLORS.gray100, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: COLORS.white, ...SHADOW.small },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  activeTabText: { color: COLORS.primary },
  leaveCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.gray100 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeText: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dateText: { fontSize: 13, color: COLORS.gray600 },
  daysText: { fontSize: 12, color: COLORS.textMuted },
  reason: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  approvalFab: { position: 'absolute', bottom: 90, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 50, ...SHADOW.medium },
  fabText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
});
