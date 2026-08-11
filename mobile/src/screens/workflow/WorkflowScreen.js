import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { leaveApi } from '../../api/leave.api';
import { worklifeApi } from '../../api/worklife.api';
import { timeAgo } from '../../utils/formatters';

const TABS = ['Pending', 'Delegated', 'Completed'];
const TYPE_ICONS = { leave: 'calendar-outline', expense: 'receipt-outline', travel: 'airplane-outline', resignation: 'exit-outline', onboarding: 'people-outline', it_request: 'laptop-outline' };

export default function WorkflowScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflow = useCallback(async () => {
    setLoading(true);
    const statusMap = { Pending: 'pending', Delegated: 'delegated', Completed: 'completed' };
    try {
      const res = await leaveApi.list({ status: statusMap[activeTab] });
      setItems(res.data?.items || res.data || []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchWorkflow(); }, [fetchWorkflow]);

  const approveItem = async (item) => {
    try {
      await leaveApi.review(item.id, { decision: 'approve' });
      Alert.alert('Approved', `${item.title || item.type} approved.`);
      fetchWorkflow();
    } catch { Alert.alert('Error', 'Action failed.'); }
  };

  const delegateItem = async (item) => {
    Alert.alert('Delegate', 'Delegation feature available in web admin.');
  };

  const renderItem = ({ item }) => {
    const icon = TYPE_ICONS[item.type] || 'document-outline';
    return (
      <View style={styles.card}>
        <View style={[styles.typeIcon, { backgroundColor: COLORS.primary + '15' }]}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.title || item.type?.replace('_', ' ')}</Text>
          <Text style={styles.itemReq}>By: {item.requester_name || item.employee_name}</Text>
          <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
          {item.description && <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>}
        </View>
        {activeTab === 'Pending' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.approveBtn} onPress={() => approveItem(item)}>
              <Ionicons name="checkmark" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.delegateBtn} onPress={() => delegateItem(item)}>
              <Ionicons name="arrow-redo-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Workflow</Text>
        <View style={[styles.pendingBadge, { backgroundColor: COLORS.danger }]}>
          <Text style={styles.pendingCount}>{items.length}</Text>
        </View>
      </View>
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={items} keyExtractor={(item, i) => String(item.id || i)} renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWorkflow} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="git-merge-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No {activeTab.toLowerCase()} items</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  pendingBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pendingCount: { fontSize: 11, fontWeight: '800', color: COLORS.white },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  typeIcon: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, textTransform: 'capitalize' },
  itemReq: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  itemTime: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  itemDesc: { fontSize: 12, color: COLORS.gray500, marginTop: 6, fontStyle: 'italic' },
  actions: { gap: 8 },
  approveBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
  delegateBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
