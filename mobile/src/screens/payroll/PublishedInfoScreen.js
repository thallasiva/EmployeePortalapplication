import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';

const TABS = [
  { key: 'payslips', label: 'Payslips', icon: 'document-text-outline', color: COLORS.primary },
  { key: 'ytd', label: 'YTD', icon: 'bar-chart-outline', color: '#059669' },
  { key: 'pf', label: 'PF YTD', icon: 'shield-outline', color: '#7c3aed' },
  { key: 'reimb', label: 'Reimbursement', icon: 'receipt-outline', color: '#0891b2' },
];

export default function PublishedInfoScreen({ navigation }) {
  const [tab, setTab] = useState('payslips');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = (t) => {
    setLoading(true);
    const ep = t === 'payslips' ? '/payroll/payslips' :
               t === 'ytd' ? '/payroll/ytd/summary' :
               t === 'pf' ? '/payroll/pf-ytd' : '/payroll/reimbursements';
    client.get(ep, { params: { limit: 50 } }).then(unwrap)
      .then(res => setData(Array.isArray(res) ? res : (res?.rows || [])))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(tab); }, [tab]);

  const renderPayslip = ({ item }) => (
    <TouchableOpacity style={styles.listCard} onPress={() => navigation.navigate('PayslipDetail', { id: item.id })}>
      <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '15' }]}>
        <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.employee_name || item.full_name}</Text>
        <Text style={styles.cardSub}>{item.month_name || item.month} {item.year} · {item.status}</Text>
      </View>
      <Text style={styles.cardAmount}>{fmt(item.net_pay || item.net_salary)}</Text>
    </TouchableOpacity>
  );

  const renderGeneric = ({ item }) => (
    <View style={styles.listCard}>
      <View style={[styles.iconBox, { backgroundColor: '#05996915' }]}>
        <Ionicons name="person-outline" size={20} color="#059669" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.employee_name || item.full_name || item.name}</Text>
        <Text style={styles.cardSub}>{item.description || item.period || item.category || ''}</Text>
      </View>
      <Text style={styles.cardAmount}>{fmt(item.amount || item.total || item.net_pay)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Published Info</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tabBtn, tab === t.key && { borderBottomColor: t.color, borderBottomWidth: 2 }]}>
            <Ionicons name={t.icon} size={16} color={tab === t.key ? t.color : COLORS.gray400} />
            <Text style={[styles.tabLabel, tab === t.key && { color: t.color }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={data} keyExtractor={(_, i) => String(i)}
          renderItem={tab === 'payslips' ? renderPayslip : renderGeneric}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cloud-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No published data yet</Text>
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
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray400 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 8, paddingTop: 60 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  cardSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  cardAmount: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  emptyText: { fontSize: 15, color: COLORS.gray400 },
});
