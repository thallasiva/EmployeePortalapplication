import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { payrollApi } from '../../api/payroll.api';
import { COLORS, SHADOW } from '../../constants/colors';
import { formatDate, formatCurrency } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';

export default function PayrollScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayslips = useCallback(async () => {
    try {
      const res = await payrollApi.myPayslips({ limit: 24 });
      setPayslips(Array.isArray(res) ? res : res?.data || res?.payslips || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);
  const onRefresh = async () => { setRefreshing(true); await fetchPayslips(); setRefreshing(false); };

  const latest = payslips[0];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.payslipCard, SHADOW.small]}
      onPress={() => navigation.navigate('PayslipDetail', { payslip: item })}
      activeOpacity={0.8}
    >
      <View style={styles.payslipLeft}>
        <View style={styles.monthIcon}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.monthText}>{(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(item.month||1)-1] + ' ' + item.year)}</Text>
          <Text style={styles.payDate}>{formatDate(item.generated_on)}</Text>
        </View>
      </View>
      <View style={styles.payslipRight}>
        <Text style={styles.netPay}>{formatCurrency(item.net_pay || item.net_salary)}</Text>
        <Badge label={item.status || 'Paid'} variant={item.status === 'Paid' ? 'success' : item.status === 'On Hold' ? 'warning' : 'info'} size="xs" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Latest Payslip Hero */}
      {latest && (
        <LinearGradient colors={['#1a1a2e', '#f18200']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.heroLabel}>Latest Payslip</Text>
          <Text style={styles.heroMonth}>{(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(latest.month||1)-1] + ' ' + latest.year)}</Text>
          <Text style={styles.heroAmount}>{formatCurrency(latest.net_pay || latest.net_salary)}</Text>
          <View style={styles.heroBreakdown}>
            <View>
              <Text style={styles.heroBreakdownLabel}>Gross</Text>
              <Text style={styles.heroBreakdownValue}>{formatCurrency(latest.gross_earnings)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View>
              <Text style={styles.heroBreakdownLabel}>Deductions</Text>
              <Text style={styles.heroBreakdownValue}>{formatCurrency(latest.deductions)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View>
              <Text style={styles.heroBreakdownLabel}>Net Pay</Text>
              <Text style={[styles.heroBreakdownValue, { color: '#86efac' }]}>{formatCurrency(latest.net_pay || latest.net_salary)}</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      <Text style={styles.listTitle}>Pay History</Text>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={payslips}
          keyExtractor={(item, i) => String(item.payslip_id || item.id || i)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="cash-outline" title="No payslips yet" subtitle="Your payslips will appear here once processed" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  hero: { padding: 24, paddingBottom: 28 },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  heroMonth: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  heroAmount: { fontSize: 36, fontWeight: '900', color: COLORS.white, marginBottom: 20 },
  heroBreakdown: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroBreakdownLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  heroBreakdownValue: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  heroDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  listTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, paddingHorizontal: 16, paddingVertical: 14 },
  payslipCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.gray100 },
  payslipLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  payDate: { fontSize: 12, color: COLORS.textMuted },
  payslipRight: { alignItems: 'flex-end', gap: 6 },
  netPay: { fontSize: 16, fontWeight: '800', color: COLORS.text },
});
