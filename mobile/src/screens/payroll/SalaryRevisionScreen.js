import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '—';

export default function SalaryRevisionScreen({ navigation }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/payroll/salary-revisions/me').then(unwrap)
      .then(res => setRevisions(Array.isArray(res) ? res : (res?.rows || [])))
      .catch(() => setRevisions([]))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }) => {
    const hike = item.new_ctc && item.old_ctc ? (((item.new_ctc - item.old_ctc) / item.old_ctc) * 100).toFixed(1) : null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="trending-up-outline" size={22} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.effectiveDate}>Effective: {item.effective_date || item.revision_date}</Text>
            <Text style={styles.revisionType}>{item.revision_type || 'Salary Revision'}</Text>
          </View>
          {hike && (
            <View style={styles.hikeBadge}>
              <Text style={styles.hikeText}>+{hike}%</Text>
            </View>
          )}
        </View>
        <View style={styles.salaryRow}>
          <View style={styles.salaryBox}>
            <Text style={styles.salaryLabel}>Previous CTC</Text>
            <Text style={styles.salaryValue}>{fmt(item.old_ctc || item.previous_ctc)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={COLORS.gray400} />
          <View style={styles.salaryBox}>
            <Text style={styles.salaryLabel}>Revised CTC</Text>
            <Text style={[styles.salaryValue, { color: '#059669' }]}>{fmt(item.new_ctc || item.revised_ctc)}</Text>
          </View>
        </View>
        {item.remarks && <Text style={styles.remarks}>{item.remarks}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salary Revision</Text>
        <View style={{ width: 38 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={revisions} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trending-up-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No salary revisions yet</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 8 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  effectiveDate: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  revisionType: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  hikeBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  hikeText: { fontSize: 14, fontWeight: '800', color: '#059669' },
  salaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: COLORS.gray50, borderRadius: 12, padding: 14 },
  salaryBox: { alignItems: 'center' },
  salaryLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600' },
  salaryValue: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, marginTop: 4 },
  remarks: { fontSize: 13, color: COLORS.gray500, fontStyle: 'italic' },
  emptyText: { fontSize: 15, color: COLORS.gray400 },
});
