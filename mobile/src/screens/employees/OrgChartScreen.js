import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;

function OrgNode({ node, level = 0 }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const indentColor = ['#f18200', '#0891b2', '#059669', '#7c3aed', '#db2777'][level % 5];

  return (
    <View style={{ marginLeft: level * 18, marginTop: 6 }}>
      <TouchableOpacity
        onPress={() => hasChildren && setExpanded(e => !e)}
        style={[styles.nodeCard, { borderLeftColor: indentColor, borderLeftWidth: 3 }]}
        activeOpacity={hasChildren ? 0.7 : 1}
      >
        <View style={[styles.avatar, { backgroundColor: indentColor + '20' }]}>
          <Text style={[styles.avatarText, { color: indentColor }]}>
            {(node.full_name || node.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nodeName}>{node.full_name || node.name}</Text>
          <Text style={styles.nodeRole}>{node.designation || node.role_name || ''}</Text>
          {node.department && <Text style={styles.nodeDept}>{node.department}</Text>}
        </View>
        {hasChildren && (
          <View style={styles.chevronBadge}>
            <Text style={styles.chevronCount}>{node.children.length}</Text>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.gray400} />
          </View>
        )}
      </TouchableOpacity>
      {expanded && hasChildren && node.children.map((child, i) => (
        <OrgNode key={child.id || i} node={child} level={level + 1} />
      ))}
    </View>
  );
}

export default function OrgChartScreen({ navigation }) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.get('/employees/org-chart').then(unwrap)
      .then(data => setTree(data))
      .catch(() => {
        client.get('/employees', { params: { limit: 50 } }).then(unwrap)
          .then(res => {
            const list = Array.isArray(res) ? res : (res?.rows || res?.employees || []);
            setTree({ full_name: 'Organization', children: list.slice(0, 20) });
          })
          .catch(() => setError('Could not load org chart'));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization Chart</Text>
        <View style={{ width: 38 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.legend}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.gray400} />
            <Text style={styles.legendText}>Tap any node with direct reports to expand/collapse</Text>
          </View>
          {tree ? <OrgNode node={tree} level={0} /> : (
            <View style={styles.center}><Text style={styles.emptyText}>No org chart data available</Text></View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.white, padding: 10, borderRadius: 10, marginBottom: 12 },
  legendText: { fontSize: 12, color: COLORS.gray400, flex: 1 },
  nodeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, marginBottom: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  nodeName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  nodeRole: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  nodeDept: { fontSize: 11, color: COLORS.gray400, marginTop: 1 },
  chevronBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chevronCount: { fontSize: 12, fontWeight: '700', color: COLORS.gray400 },
  errorText: { fontSize: 15, color: COLORS.danger, textAlign: 'center', marginTop: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray400 },
});
