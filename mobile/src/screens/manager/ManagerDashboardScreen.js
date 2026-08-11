import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { getInitials } from '../../utils/formatters';

const KpiCard = ({ label, value, color, icon }) => (
  <View style={[styles.kpiCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

export default function ManagerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ team_size: 0, present: 0, on_leave: 0, pending_leaves: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [att, leaves] = await Promise.all([
        client.get('/attendance/dashboard').catch(() => ({ data: {} })),
        client.get('/leave/requests', { params: { status: 'Pending', limit: 50 } }).catch(() => ({ data: {} })),
      ]);
      const d = att.data?.data ?? att.data ?? {};
      const lr = leaves.data?.data ?? leaves.data ?? {};
      const rows = Array.isArray(lr) ? lr : (lr?.rows || lr?.data || []);
      setStats({ team_size: Number(d.total_employees||0), present: Number(d.present_today||0), on_leave: Number(d.on_leave_today||0), pending_leaves: rows.length });
    } catch (e) { console.log('mgr dash', e?.message); }
  }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, [load]);

  const name = user?.full_name || user?.name || 'Manager';
  const quickActions = [
    { label: 'Team Attendance', icon: 'finger-print-outline', route: 'TeamAttendance', color: COLORS.success },
    { label: 'Leave Requests', icon: 'calendar-outline', route: 'TeamLeave', color: COLORS.info },
    { label: 'Timesheets', icon: 'time-outline', route: 'Timesheets', color: COLORS.warning },
    { label: 'Performance', icon: 'ribbon-outline', route: 'PerformanceAdmin', color: '#db2777' },
    { label: 'People', icon: 'people-outline', route: 'People', color: COLORS.primary },
    { label: 'Reports', icon: 'bar-chart-outline', route: 'Reports', color: '#059669' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
        <LinearGradient colors={['#1a2535', '#2d3748', COLORS.primary + 'cc']} style={styles.banner}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(name)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{user?.role_name || 'Manager'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </LinearGradient>
        <Text style={styles.sectionTitle}>Team Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
          <KpiCard label="Team Size" value={stats.team_size} color={COLORS.secondary} icon="people-outline" />
          <KpiCard label="Present" value={stats.present} color={COLORS.success} icon="checkmark-circle-outline" />
          <KpiCard label="On Leave" value={stats.on_leave} color={COLORS.info} icon="calendar-outline" />
          <KpiCard label="Leave Reqs" value={stats.pending_leaves} color={COLORS.warning} icon="hourglass-outline" />
        </ScrollView>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {quickActions.map(a => (
            <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.route)}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 18, fontWeight: '900', color: COLORS.white },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  name: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  role: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  kpiRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  kpiCard: { width: 90, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, borderLeftWidth: 3, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: COLORS.gray500, fontWeight: '600', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, paddingBottom: 32 },
  actionCard: { width: '30%', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  actionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.secondary, textAlign: 'center' },
});
