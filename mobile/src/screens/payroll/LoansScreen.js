import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';
const STATUS_COLOR = { active: '#059669', closed: COLORS.gray400, pending: '#f59e0b', rejected: '#ef4444' };

export default function LoansScreen({ navigation }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/payroll/loans/my').then(unwrap)
      .then(res => setLoans(Array.isArray(res) ? res : (res?.rows || [])))
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }) => {
    const pct = item.principal && item.outstanding ? Math.round(((item.principal - item.outstanding) / item.principal) * 100) : 0;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="cash-outline" size={22} color="#0891b2" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.loanType}>{item.loan_type || 'Employee Loan'}</Text>
            <Text style={styles.loanDate}>Disbursed: {item.disbursement_date || item.start_date}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] || COLORS.gray400) + '20' }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] || COLORS.gray400 }]}>
              {(item.status || 'active').charAt(0).toUpperCase() + (item.status || 'active').slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.amountsRow}>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Principal</Text>
            <Text style={styles.amountValue}>{fmt(item.principal || item.loan_amount)}</Text>
          </View>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Outstanding</Text>
            <Text style={[styles.amountValue, { color: '#ef4444' }]}>{fmt(item.outstanding || item.balance)}</Text>
          </View>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>EMI/Month</Text>
            <Text style={styles.amountValue}>{fmt(item.emi || item.monthly_emi)}</Text>
          </View>
        </View>

        {item.principal && item.outstanding != null && (
          <View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: '#059669' }]} />
            </View>
            <Text style={styles.progressLabel}>{pct}% repaid · {item.remaining_months || '?'} months remaining</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loans & Advances</Text>
        <TouchableOpacity onPress={() => Alert.alert('Loan Request', 'Please contact HR to apply for a new loan.')} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={loans} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cash-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No active loans</Text>
              <Text style={styles.emptySubText}>Contact HR to apply for a loan</Text>
            </View>
          } />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 8, paddingTop: 60 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  loanType: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  loanDate: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.gray50, borderRadius: 12, padding: 12 },
  amountBlock: { alignItems: 'center' },
  amountLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600' },
  amountValue: { fontSize: 15, fontWeight: '800', color: COLORS.secondary, marginTop: 4 },
  progressTrack: { height: 6, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: COLORS.gray400, marginTop: 4, textAlign: 'right' },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.gray400 },
  emptySubText: { fontSize: 13, color: COLORS.gray300 },
});
