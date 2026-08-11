import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '—';

export default function SalaryTemplatesScreen({ navigation }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/payroll/salary-templates').then(unwrap)
      .then(res => setTemplates(Array.isArray(res) ? res : (res?.rows || [])))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Ionicons name="layers-outline" size={22} color="#059669" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.templateName}>{item.name || item.template_name}</Text>
          <Text style={styles.templateDesc}>{item.description || (item.components?.length || 0) + ' components'}</Text>
        </View>
        {item.is_default && (
          <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>
        )}
      </View>
      {item.components && item.components.length > 0 && (
        <View style={styles.componentsList}>
          {item.components.slice(0, 4).map((c, i) => (
            <View key={i} style={styles.componentRow}>
              <Text style={styles.componentName}>{c.name || c.component_name}</Text>
              <Text style={styles.componentValue}>
                {c.type === 'percentage' ? `${c.value}%` : fmt(c.value)}
              </Text>
            </View>
          ))}
          {item.components.length > 4 && (
            <Text style={styles.moreComponents}>+{item.components.length - 4} more components</Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salary Templates</Text>
        <View style={{ width: 38 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={templates} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="layers-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No salary templates defined</Text>
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
  templateName: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  templateDesc: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  defaultBadge: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  defaultText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  componentsList: { backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10, gap: 6 },
  componentRow: { flexDirection: 'row', justifyContent: 'space-between' },
  componentName: { fontSize: 13, color: COLORS.gray600 || COLORS.gray500 },
  componentValue: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },
  moreComponents: { fontSize: 12, color: COLORS.gray400, fontStyle: 'italic', textAlign: 'center', marginTop: 2 },
  emptyText: { fontSize: 15, color: COLORS.gray400 },
});
