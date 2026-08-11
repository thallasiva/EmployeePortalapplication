import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { payrollApi } from '../../api/payroll.api';
import { formatCurrency } from '../../utils/formatters';

const BreakdownRow = ({ label, value, isTotal, isDeduction }) => (
  <View style={[styles.breakRow, isTotal && styles.breakRowTotal]}>
    <Text style={[styles.breakLabel, isTotal && styles.breakLabelTotal]}>{label}</Text>
    <Text style={[styles.breakVal, isDeduction && { color: COLORS.danger }, isTotal && styles.breakValTotal]}>
      {isDeduction ? '- ' : ''}{formatCurrency(value)}
    </Text>
  </View>
);

export default function PayslipDetailScreen({ route, navigation }) {
  const { payslipId, month, year } = route.params || {};
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPayslip = async () => {
    try {
      const res = await payrollApi.payslip(payslipId || route?.params?.id);
      setPayslip(res.data?.payslip || res.data);
    } catch {
      setPayslip(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayslip(); }, [payslipId]);

  const handleShare = async () => {
    try {
      await Share.share({ message: `Payslip for ${payslip?.month_name} ${payslip?.year}\nNet Pay: ${formatCurrency(payslip?.net_pay)}` });
    } catch {}
  };

  if (loading) return <View style={styles.center}><Text style={{ color: COLORS.gray400 }}>Loading...</Text></View>;
  if (!payslip) return <View style={styles.center}><Text style={{ color: COLORS.gray400 }}>Payslip not found</Text></View>;

  const earnings = payslip.earnings || payslip.earnings_breakdown || {};
  const deductions = payslip.deductions || payslip.deductions_breakdown || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPayslip} colors={[COLORS.primary]} />}>
        {/* Header Banner */}
        <LinearGradient colors={['#1a2535', '#2d3748']} style={styles.banner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{payslip.month_name} {payslip.year}</Text>
          <Text style={styles.netPay}>{formatCurrency(payslip.net_pay)}</Text>
          <Text style={styles.netLabel}>Net Pay</Text>
          <View style={styles.pillRow}>
            <View style={styles.pill}><Text style={styles.pillText}>{payslip.payment_status || 'Paid'}</Text></View>
            <View style={styles.pill}><Text style={styles.pillText}>{payslip.payment_mode || 'Bank Transfer'}</Text></View>
          </View>
        </LinearGradient>

        {/* Employee Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Employee Details</Text>
          <View style={styles.twoCol}>
            <View style={styles.colItem}>
              <Text style={styles.colLabel}>Name</Text>
              <Text style={styles.colVal}>{payslip.employee_name}</Text>
            </View>
            <View style={styles.colItem}>
              <Text style={styles.colLabel}>Emp ID</Text>
              <Text style={styles.colVal}>{payslip.employee_id}</Text>
            </View>
            <View style={styles.colItem}>
              <Text style={styles.colLabel}>Department</Text>
              <Text style={styles.colVal}>{payslip.department}</Text>
            </View>
            <View style={styles.colItem}>
              <Text style={styles.colLabel}>Designation</Text>
              <Text style={styles.colVal}>{payslip.designation}</Text>
            </View>
            <View style={styles.colItem}>
              <Text style={styles.colLabel}>Working Days</Text>
              <Text style={styles.colVal}>{payslip.working_days} / {payslip.total_days}</Text>
            </View>
            <View style={styles.colItem}>
              <Text style={styles.colLabel}>LOP Days</Text>
              <Text style={[styles.colVal, { color: COLORS.danger }]}>{payslip.lop_days || 0}</Text>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Earnings</Text>
          {Object.entries(earnings).map(([k, v]) => (
            <BreakdownRow key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={v} />
          ))}
          <BreakdownRow label="Gross Earnings" value={payslip.gross_pay || payslip.gross_earnings} isTotal />
        </View>

        {/* Deductions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Deductions</Text>
          {Object.entries(deductions).map(([k, v]) => (
            <BreakdownRow key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={v} isDeduction />
          ))}
          <BreakdownRow label="Total Deductions" value={payslip.deductions} isTotal isDeduction />
        </View>

        {/* Net Summary */}
        <View style={[styles.card, styles.netCard]}>
          <View style={styles.netRow}>
            <Text style={styles.netRowLabel}>Gross Pay</Text>
            <Text style={styles.netRowVal}>{formatCurrency(payslip.gross_pay)}</Text>
          </View>
          <View style={styles.netRow}>
            <Text style={styles.netRowLabel}>Total Deductions</Text>
            <Text style={[styles.netRowVal, { color: COLORS.danger }]}>- {formatCurrency(payslip.deductions)}</Text>
          </View>
          <View style={[styles.netRow, styles.netFinalRow]}>
            <Text style={styles.netFinalLabel}>Net Pay</Text>
            <Text style={styles.netFinalVal}>{formatCurrency(payslip.net_pay)}</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { paddingTop: 20, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 16 },
  backBtn: { position: 'absolute', top: 20, left: 16, width: 36, height: 36, justifyContent: 'center' },
  shareBtn: { position: 'absolute', top: 20, right: 16, width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-end' },
  monthLabel: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8, marginBottom: 8 },
  netPay: { fontSize: 36, fontWeight: '900', color: COLORS.white },
  netLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: 12 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  card: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colItem: { width: '46%' },
  colLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', marginBottom: 2 },
  colVal: { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  breakRowTotal: { borderBottomWidth: 0, marginTop: 4, paddingTop: 12, borderTopWidth: 1.5, borderTopColor: COLORS.gray200 },
  breakLabel: { fontSize: 13, color: COLORS.gray600 },
  breakLabelTotal: { fontWeight: '700', color: COLORS.secondary },
  breakVal: { fontSize: 13, color: COLORS.secondary, fontWeight: '500' },
  breakValTotal: { fontWeight: '800' },
  netCard: { backgroundColor: COLORS.secondary },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  netRowLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  netRowVal: { fontSize: 14, color: COLORS.white, fontWeight: '600' },
  netFinalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  netFinalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  netFinalVal: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
});
