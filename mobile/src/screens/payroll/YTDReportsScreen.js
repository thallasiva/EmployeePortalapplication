import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';

function SummaryRow({ label, value, highlight }) {
  return (
    <View style={[styles.row, highlight && styles.rowHighlight]}>
      <Text style={[styles.rowLabel, highlight && styles.rowLabelHL]}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHL]}>{value}</Text>
    </View>
  );
}

export default function YTDReportsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    client.get('/payroll/ytd/me', { params: { year } }).then(unwrap)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YTD Reports</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.yearBadge}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.yearText}>FY {year}-{year + 1} Year-to-Date Summary</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earnings</Text>
            <SummaryRow label="Basic Salary" value={fmt(data?.basic_total)} />
            <SummaryRow label="HRA" value={fmt(data?.hra_total)} />
            <SummaryRow label="Special Allowance" value={fmt(data?.special_allowance_total)} />
            <SummaryRow label="Other Allowances" value={fmt(data?.other_allowances_total)} />
            <SummaryRow label="Arrears" value={fmt(data?.arrears_total)} />
            <SummaryRow label="Total Gross Earnings" value={fmt(data?.gross_total)} highlight />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deductions</Text>
            <SummaryRow label="PF (Employee)" value={fmt(data?.pf_employee_total)} />
            <SummaryRow label="PF (Employer)" value={fmt(data?.pf_employer_total)} />
            <SummaryRow label="ESI" value={fmt(data?.esi_total)} />
            <SummaryRow label="TDS / Income Tax" value={fmt(data?.tds_total)} />
            <SummaryRow label="Professional Tax" value={fmt(data?.pt_total)} />
            <SummaryRow label="Loans" value={fmt(data?.loan_deduction_total)} />
            <SummaryRow label="Total Deductions" value={fmt(data?.total_deductions)} highlight />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Net Summary</Text>
            <SummaryRow label="Net Pay (Take Home)" value={fmt(data?.net_pay_total)} highlight />
            <SummaryRow label="Months Paid" value={String(data?.months_paid || 0)} />
          </View>

          {!data && (
            <View style={styles.center}>
              <Ionicons name="bar-chart-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No YTD data available</Text>
            </View>
          )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  yearBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary + '15', padding: 12, borderRadius: 12, marginBottom: 16 },
  yearText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  section: { backgroundColor: COLORS.white, borderRadius: 14, padding: 4, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  rowHighlight: { backgroundColor: COLORS.primary + '08' },
  rowLabel: { fontSize: 14, color: COLORS.gray600 || COLORS.gray500 },
  rowLabelHL: { fontWeight: '700', color: COLORS.secondary },
  rowValue: { fontSize: 14, color: COLORS.secondary },
  rowValueHL: { fontWeight: '800', color: COLORS.primary },
  emptyText: { fontSize: 15, color: COLORS.gray400 },
});
