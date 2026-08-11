import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { salaryApi } from '../../api/salary.api';
import { formatCurrency } from '../../utils/formatters';

const TABS = ['Structures', 'Components', 'Assignments'];

export default function SalaryStructuresScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Structures');
  const [structures, setStructures] = useState([]);
  const [components, setComponents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes, aRes] = await Promise.all([
        salaryApi.structures(),
        salaryApi.components(),
        salaryApi.assignments(),
      ]);
      setStructures(Array.isArray(sRes) ? sRes : (sRes?.structures || sRes?.items || []));
      setComponents(Array.isArray(cRes) ? cRes : (cRes?.components || cRes?.items || []));
      setAssignments(Array.isArray(aRes) ? aRes : (aRes?.assignments || aRes?.items || []));
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const renderStructure = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.structure_name || item.name}</Text>
        <View style={[styles.badge, { backgroundColor: COLORS.primary + '15' }]}>
          <Text style={[styles.badgeText, { color: COLORS.primary }]}>{item.employee_count || 0} emp</Text>
        </View>
      </View>
      <View style={styles.salaryRow}>
        <View style={styles.salaryItem}>
          <Text style={styles.salaryLabel}>Gross</Text>
          <Text style={styles.salaryVal}>{formatCurrency(item.gross_salary || item.gross || 0)}</Text>
        </View>
        <View style={styles.salaryDivider} />
        <View style={styles.salaryItem}>
          <Text style={styles.salaryLabel}>Net</Text>
          <Text style={[styles.salaryVal, { color: COLORS.success }]}>{formatCurrency(item.net_salary || item.net || 0)}</Text>
        </View>
        <View style={styles.salaryDivider} />
        <View style={styles.salaryItem}>
          <Text style={styles.salaryLabel}>Deductions</Text>
          <Text style={[styles.salaryVal, { color: COLORS.danger }]}>{formatCurrency(item.total_deductions || 0)}</Text>
        </View>
      </View>
      {item.components && item.components.length > 0 && (
        <View style={styles.compRow}>
          {item.components.slice(0, 4).map((c, i) => (
            <View key={i} style={styles.compChip}><Text style={styles.compChipText}>{c.name || c}</Text></View>
          ))}
          {item.components.length > 4 && <Text style={styles.moreText}>+{item.components.length - 4} more</Text>}
        </View>
      )}
    </View>
  );

  const renderComponent = ({ item }) => (
    <View style={styles.compCard}>
      <View style={[styles.compTypeIcon, { backgroundColor: item.type === 'earning' ? COLORS.success + '15' : COLORS.danger + '15' }]}>
        <Ionicons name={item.type === 'earning' ? 'trending-up-outline' : 'trending-down-outline'} size={18} color={item.type === 'earning' ? COLORS.success : COLORS.danger} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.compName}>{item.component_name || item.name}</Text>
        <Text style={styles.compType}>{item.type} · {item.calculation_type || 'Fixed'}</Text>
      </View>
      <Text style={[styles.compAmount, { color: item.type === 'earning' ? COLORS.success : COLORS.danger }]}>
        {item.calculation_type === 'percentage' ? `${item.value || item.percentage}%` : formatCurrency(item.value || item.amount || 0)}
      </Text>
    </View>
  );

  const renderAssignment = ({ item }) => (
    <View style={styles.assignCard}>
      <View style={styles.assignAvatar}><Text style={styles.assignAvatarText}>{(item.employee_name || 'U')[0]}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.assignName}>{item.employee_name}</Text>
        <Text style={styles.assignStructure}>{item.structure_name}</Text>
        <Text style={styles.assignDate}>Effective: {item.effective_date}</Text>
      </View>
      <Text style={styles.assignSalary}>{formatCurrency(item.gross_salary || item.ctc || 0)}</Text>
    </View>
  );

  const getListData = () => ({ Structures: structures, Components: components, Assignments: assignments }[activeTab] || []);
  const getRender = () => ({ Structures: renderStructure, Components: renderComponent, Assignments: renderAssignment }[activeTab]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Salary Management</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={getListData()}
        keyExtractor={(item, i) => String(item.id || i)}
        renderItem={getRender()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="cash-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No {activeTab.toLowerCase()} found</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  salaryRow: { flexDirection: 'row', backgroundColor: COLORS.gray50, borderRadius: 10, padding: 12, marginBottom: 10 },
  salaryItem: { flex: 1, alignItems: 'center' },
  salaryLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', marginBottom: 4 },
  salaryVal: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  salaryDivider: { width: 1, backgroundColor: COLORS.gray200 },
  compRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  compChip: { backgroundColor: COLORS.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  compChipText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  moreText: { fontSize: 12, color: COLORS.gray400, paddingVertical: 4 },
  compCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  compTypeIcon: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  compName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  compType: { fontSize: 12, color: COLORS.gray400, marginTop: 2, textTransform: 'capitalize' },
  compAmount: { fontSize: 15, fontWeight: '800' },
  assignCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  assignAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  assignAvatarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  assignName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  assignStructure: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  assignDate: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  assignSalary: { fontSize: 15, fontWeight: '800', color: COLORS.success },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
