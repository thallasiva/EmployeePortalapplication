import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';

function InfoRow({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '800', color: COLORS.secondary }]}>{value}</Text>
    </View>
  );
}

export default function ITStatementScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/payroll/it-statement/me').then(unwrap)
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
        <Text style={styles.headerTitle}>IT Statement</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.taxCard}>
            <Text style={styles.taxCardLabel}>Estimated Tax Liability</Text>
            <Text style={styles.taxCardAmount}>{fmt(data?.tax_liability || data?.estimated_tax)}</Text>
            <Text style={styles.taxCardSub}>FY {new Date().getFullYear()}-{new Date().getFullYear() + 1}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income</Text>
            <InfoRow label="Gross Salary" value={fmt(data?.gross_salary)} />
            <InfoRow label="HRA Exemption" value={`- ${fmt(data?.hra_exemption)}`} />
            <InfoRow label="Standard Deduction" value={`- ${fmt(data?.standard_deduction || 50000)}`} />
            <InfoRow label="Net Taxable Income" value={fmt(data?.net_taxable_income)} bold />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deductions Claimed</Text>
            <InfoRow label="80C (PF + LIC + etc.)" value={fmt(data?.deduction_80c)} />
            <InfoRow label="80D (Medical Ins.)" value={fmt(data?.deduction_80d)} />
            <InfoRow label="80G (Donations)" value={fmt(data?.deduction_80g)} />
            <InfoRow label="HRA" value={fmt(data?.hra_exemption)} />
            <InfoRow label="Total Deductions" value={fmt(data?.total_deductions)} bold />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tax Computation</Text>
            <InfoRow label="Tax on Income" value={fmt(data?.tax_on_income)} />
            <InfoRow label="Surcharge" value={fmt(data?.surcharge || 0)} />
            <InfoRow label="Health & Ed. Cess (4%)" value={fmt(data?.health_cess)} />
            <InfoRow label="Total Tax" value={fmt(data?.total_tax || data?.tax_liability)} bold />
            <InfoRow label="TDS Deducted (YTD)" value={fmt(data?.tds_deducted)} />
            <InfoRow label="Balance Tax Payable" value={fmt(data?.balance_tax)} bold />
          </View>

          {!data && (
            <View style={styles.center}>
              <Ionicons name="calculator-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>IT Statement not available yet</Text>
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
  taxCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  taxCardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  taxCardAmount: { fontSize: 32, fontWeight: '900', color: COLORS.white, marginVertical: 4 },
  taxCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  section: { backgroundColor: COLORS.white, borderRadius: 14, padding: 4, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  rowLabel: { fontSize: 14, color: COLORS.gray500 },
  rowValue: { fontSize: 14, color: COLORS.gray600 || COLORS.gray500 },
  emptyText: { fontSize: 15, color: COLORS.gray400 },
});
