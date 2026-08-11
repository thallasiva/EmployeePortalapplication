import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { payrollApi } from '../../api/payroll.api';
import client from '../../api/client';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const unwrap = r => r.data?.data ?? r.data;

function buildMonthList() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= -1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return months;
}

const fmtINR = (n) => {
  if (n === undefined || n === null) return '—';
  const num = Number(n);
  if (isNaN(num)) return '—';
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};

const statusColor = (s) => {
  const m = { Paid: COLORS.success, Generated: COLORS.info, 'On Hold': COLORS.warning };
  return m[s] || COLORS.gray400;
};

export default function PayrollAdminScreen({ navigation }) {
  const months = buildMonthList();
  const now = new Date();
  const defaultIdx = months.findIndex(m => m.month === now.getMonth() + 1 && m.year === now.getFullYear());
  const [selIdx, setSelIdx] = useState(defaultIdx >= 0 ? defaultIdx : months.length - 2);
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const selected = months[selIdx];
  const isFuture = new Date(selected.year, selected.month - 1, 1) > new Date(now.getFullYear(), now.getMonth(), 1);
  const isProcessed = runs.some(r => r.month === selected.month && r.year === selected.year);

  const load = useCallback(async () => {
    try {
      const [ps, emps, rs] = await Promise.all([
        payrollApi.list({ month: selected.month, year: selected.year, limit: 500 }),
        payrollApi.employees ? payrollApi.employees() : client.get('/employees', { params: { status: 'Active', limit: 500 } }).then(unwrap),
        payrollApi.payrollRuns({ year: selected.year, limit: 100 }).catch(() => []),
      ]);
      setPayslips(Array.isArray(ps) ? ps : ps?.data || []);
      setEmployees(Array.isArray(emps) ? emps : emps?.data || []);
      setRuns(Array.isArray(rs) ? rs : rs?.data || []);
    } catch (e) {
      console.log('PayrollAdmin load error', e?.message);
    }
  }, [selected.month, selected.year]);

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

  const handleProcess = useCallback(async () => {
    if (isFuture) { Alert.alert('Cannot Process', 'Cannot run payroll for a future month.'); return; }
    Alert.alert(
      'Process Payroll',
      `Generate payslips for ${MONTHS_FULL[selected.month - 1]} ${selected.year}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process', style: 'default',
          onPress: async () => {
            setProcessing(true);
            try {
              await client.post('/payroll/generate-all', { month: selected.month, year: selected.year }).then(unwrap);
              Alert.alert('Success', `Payroll processed for ${MONTHS_FULL[selected.month - 1]} ${selected.year}`);
              load();
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Payroll processing failed');
            } finally { setProcessing(false); }
          },
        },
      ]
    );
  }, [isFuture, selected, load]);

  const handleMarkPaid = useCallback(async (payslipId) => {
    Alert.alert('Mark as Paid', 'Mark this payslip as paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid', style: 'default',
        onPress: async () => {
          try {
            await payrollApi.markPaid(payslipId);
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to mark as paid');
          }
        },
      },
    ]);
  }, [load]);

  // KPI calculations
  const gross = payslips.reduce((s, p) => s + Number(p.gross_earnings || p.gross || 0), 0);
  const deductions = payslips.reduce((s, p) => s + Number(p.deductions || 0), 0);
  const net = payslips.reduce((s, p) => s + Number(p.net_pay || p.net || 0), 0);
  const empCount = employees.length;

  const renderPayslip = ({ item }) => {
    const monthLabel = `${MONTHS[(item.month || 1) - 1]} ${item.year}`;
    const sColor = statusColor(item.status);
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.empAvatar}>
            <Text style={styles.empAvatarText}>{(item.employee_name || item.full_name || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.empName} numberOfLines={1}>{item.employee_name || item.full_name || 'Employee'}</Text>
            <Text style={styles.empSub}>{item.emp_code || ''} · {monthLabel}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sColor + '20' }]}>
            <Text style={[styles.badgeText, { color: sColor }]}>{item.status || 'Pending'}</Text>
          </View>
        </View>
        <View style={styles.payRow}>
          <View style={styles.payItem}>
            <Text style={styles.payLabel}>Gross</Text>
            <Text style={styles.payVal}>{fmtINR(item.gross_earnings || item.gross)}</Text>
          </View>
          <View style={styles.payDivider} />
          <View style={styles.payItem}>
            <Text style={styles.payLabel}>Deductions</Text>
            <Text style={[styles.payVal, { color: COLORS.danger }]}>{fmtINR(item.deductions)}</Text>
          </View>
          <View style={styles.payDivider} />
          <View style={styles.payItem}>
            <Text style={styles.payLabel}>Net Pay</Text>
            <Text style={[styles.payVal, { color: COLORS.success }]}>{fmtINR(item.net_pay || item.net)}</Text>
          </View>
        </View>
        {item.status !== 'Paid' && (
          <TouchableOpacity style={styles.paidBtn} onPress={() => handleMarkPaid(item.payslip_id || item.id)}>
            <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
            <Text style={styles.paidBtnText}>Mark Paid</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Payroll Processing</Text>
          <Text style={styles.subtitle}>Generate and manage monthly payslips</Text>
        </View>
        <TouchableOpacity
          style={[styles.processBtn, (processing || isFuture) && { opacity: 0.5 }]}
          onPress={handleProcess}
          disabled={processing || isFuture}
        >
          {processing
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Ionicons name="play-circle-outline" size={16} color={COLORS.white} />}
          <Text style={styles.processBtnText}>{processing ? 'Running…' : 'Run Payroll'}</Text>
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {months.map((m, i) => {
          const processed = runs.some(r => r.month === m.month && r.year === m.year);
          const future = new Date(m.year, m.month - 1, 1) > new Date(now.getFullYear(), now.getMonth(), 1);
          const active = i === selIdx;
          return (
            <TouchableOpacity key={`${m.year}-${m.month}`} onPress={() => setSelIdx(i)}
              style={[styles.monthChip, active && styles.monthChipActive, future && styles.monthChipFuture]}>
              <Text style={[styles.monthChipText, active && styles.monthChipTextActive, future && { color: COLORS.gray300 }]}>
                {MONTHS[m.month - 1]} {m.year}
              </Text>
              {processed && !active && <View style={styles.monthDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading payroll data…</Text>
        </View>
      ) : (
        <FlatList
          data={payslips}
          keyExtractor={(item, i) => String(item.payslip_id || item.id || i)}
          renderItem={renderPayslip}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListHeaderComponent={() => (
            <View style={{ marginBottom: 4 }}>
              {/* Status Banner */}
              {isProcessed ? (
                <View style={styles.processedBanner}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.processedText}>Payroll processed for {MONTHS_FULL[selected.month - 1]} {selected.year}</Text>
                </View>
              ) : isFuture ? (
                <View style={[styles.processedBanner, { backgroundColor: COLORS.gray100 }]}>
                  <Ionicons name="time-outline" size={16} color={COLORS.gray400} />
                  <Text style={[styles.processedText, { color: COLORS.gray500 }]}>Future month — payroll not yet available</Text>
                </View>
              ) : (
                <View style={[styles.processedBanner, { backgroundColor: COLORS.warning + '15' }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={COLORS.warning} />
                  <Text style={[styles.processedText, { color: COLORS.warning }]}>Payroll not yet processed — tap "Run Payroll" to generate</Text>
                </View>
              )}

              {/* KPI Grid */}
              <View style={styles.kpiGrid}>
                {[
                  { label: 'Gross Pay', val: fmtINR(gross), icon: 'cash-outline', color: COLORS.primary },
                  { label: 'Net Pay', val: fmtINR(net), icon: 'checkmark-circle-outline', color: COLORS.success },
                  { label: 'Deductions', val: fmtINR(deductions), icon: 'remove-circle-outline', color: '#6366f1' },
                  { label: 'Employees', val: empCount || payslips.length, icon: 'people-outline', color: COLORS.info },
                ].map(k => (
                  <View key={k.label} style={styles.kpiCard}>
                    <View style={[styles.kpiIcon, { backgroundColor: k.color + '15' }]}>
                      <Ionicons name={k.icon} size={18} color={k.color} />
                    </View>
                    <Text style={styles.kpiVal}>{k.val}</Text>
                    <Text style={styles.kpiLabel}>{k.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.listHeader}>
                {payslips.length} payslip{payslips.length !== 1 ? 's' : ''} · {MONTHS_FULL[selected.month - 1]} {selected.year}
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyTitle}>No payslips yet</Text>
              <Text style={styles.emptyDesc}>Run payroll to generate payslips for this month</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  subtitle: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  processBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  processBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  monthScroll: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, paddingVertical: 12 },
  monthChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.gray50, borderWidth: 1.5, borderColor: COLORS.gray100, position: 'relative' },
  monthChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  monthChipFuture: { opacity: 0.5 },
  monthChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
  monthChipTextActive: { color: COLORS.white },
  monthDot: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.gray400 },
  processedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.success + '15', borderRadius: 10, padding: 10, marginBottom: 12 },
  processedText: { fontSize: 13, color: COLORS.success, fontWeight: '600', flex: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  kpiCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  kpiVal: { fontSize: 18, fontWeight: '900', color: COLORS.secondary, marginBottom: 2 },
  kpiLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', textAlign: 'center' },
  listHeader: { fontSize: 12, fontWeight: '700', color: COLORS.gray400, marginBottom: 6 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, gap: 10 },
  empAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  empAvatarText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empSub: { fontSize: 11, color: COLORS.gray400, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  payRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10 },
  payItem: { flex: 1, alignItems: 'center' },
  payLabel: { fontSize: 10, color: COLORS.gray400, fontWeight: '600', marginBottom: 2 },
  payVal: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  payDivider: { width: 1, height: 28, backgroundColor: COLORS.gray200 },
  paidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.success + '40', backgroundColor: COLORS.success + '08' },
  paidBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray400 },
  emptyDesc: { fontSize: 13, color: COLORS.gray300, textAlign: 'center', maxWidth: 220 },
});
