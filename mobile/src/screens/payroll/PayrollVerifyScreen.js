import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TABS = [
  { key: 'quick', label: 'Quick Statement', icon: 'flash-outline' },
  { key: 'statement', label: 'Payroll Statement', icon: 'document-text-outline' },
  { key: 'ctc', label: 'CTC Payslip', icon: 'receipt-outline' },
  { key: 'diff', label: 'Differences', icon: 'git-compare-outline' },
];

export default function PayrollVerifyScreen({ navigation }) {
  const [tab, setTab] = useState('quick');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const load = (t) => {
    setLoading(true);
    const endpoint = t === 'quick' ? '/payroll/verify/quick' :
                     t === 'statement' ? '/payroll/verify/statement' :
                     t === 'ctc' ? '/payroll/verify/ctc' : '/payroll/verify/diff';
    client.get(endpoint, { params: { month, year } }).then(unwrap)
      .then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  };

  const switchTab = (t) => { setTab(t); setData(null); };

  const renderTableRow = (row, i) => (
    <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
      <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{row.employee_name || row.name}</Text>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(row.gross)}</Text>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(row.deductions)}</Text>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', color: COLORS.primary, fontWeight: '700' }]}>{fmt(row.net)}</Text>
    </View>
  );

  const rows = Array.isArray(data) ? data : (data?.rows || data?.employees || []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Payroll</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Month selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={m} onPress={() => setMonth(i + 1)} style={[styles.monthBtn, month === i + 1 && styles.monthBtnActive]}>
            <Text style={[styles.monthText, month === i + 1 && styles.monthTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => switchTab(t.key)} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}>
            <Ionicons name={t.icon} size={16} color={tab === t.key ? COLORS.white : COLORS.gray500} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!data ? (
        <View style={styles.center}>
          <TouchableOpacity onPress={() => load(tab)} style={styles.loadBtn}>
            <Ionicons name="play-circle-outline" size={24} color={COLORS.white} />
            <Text style={styles.loadBtnText}>Load {TABS.find(t => t.key === tab)?.label}</Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>for {MONTHS[month - 1]} {year}</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView>
          {/* Summary KPIs */}
          {data?.summary && (
            <View style={styles.kpiRow}>
              <View style={styles.kpi}><Text style={styles.kpiVal}>{data.summary.count || 0}</Text><Text style={styles.kpiLabel}>Employees</Text></View>
              <View style={styles.kpi}><Text style={styles.kpiVal}>{fmt(data.summary.total_gross)}</Text><Text style={styles.kpiLabel}>Total Gross</Text></View>
              <View style={styles.kpi}><Text style={styles.kpiVal}>{fmt(data.summary.total_net)}</Text><Text style={styles.kpiLabel}>Net Payable</Text></View>
            </View>
          )}
          {/* Table */}
          {rows.length > 0 && (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Employee</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Gross</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Deduct.</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Net</Text>
              </View>
              {rows.map(renderTableRow)}
            </View>
          )}
          {rows.length === 0 && <View style={styles.center}><Text style={styles.emptyText}>No data for {MONTHS[month-1]} {year}</Text></View>}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  monthScroll: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, maxHeight: 56 },
  monthBtn: { paddingHorizontal: 14, paddingVertical: 8, marginVertical: 10, borderRadius: 20, marginRight: 6 },
  monthBtnActive: { backgroundColor: COLORS.primary },
  monthText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  monthTextActive: { color: COLORS.white },
  tabScroll: { maxHeight: 52, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.gray200, marginVertical: 8 },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  tabTextActive: { color: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  loadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  loadBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  hintText: { fontSize: 13, color: COLORS.gray400 },
  kpiRow: { flexDirection: 'row', padding: 16, gap: 10 },
  kpi: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  kpiVal: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  kpiLabel: { fontSize: 11, color: COLORS.gray400, marginTop: 4 },
  table: { margin: 16, backgroundColor: COLORS.white, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  tableHeader: { backgroundColor: COLORS.secondary },
  tableHeaderCell: { fontSize: 11, fontWeight: '800', color: COLORS.white, paddingHorizontal: 10, paddingVertical: 10 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  tableRowAlt: { backgroundColor: COLORS.gray50 },
  tableCell: { fontSize: 12, color: COLORS.secondary },
  emptyText: { fontSize: 15, color: COLORS.gray400 },
});
