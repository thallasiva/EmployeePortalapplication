import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard.api';
import { attendanceApi } from '../../api/attendance.api';
import { leaveApi } from '../../api/leave.api';
import StatCard from '../../components/common/StatCard';
import { COLORS, SHADOW } from '../../constants/colors';
import { formatDate, formatTime, getInitials } from '../../utils/formatters';
import { ROUTES } from '../../constants/routes';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS_ADMIN = [
  { icon: 'people-outline',        label: 'Employees',   route: ROUTES.EMPLOYEES,   color: '#7c3aed', bg: '#f5f3ff' },
  { icon: 'calendar-outline',      label: 'Attendance',  route: ROUTES.ATTENDANCE,  color: '#0284c7', bg: '#f0f9ff' },
  { icon: 'document-text-outline', label: 'Leave',       route: ROUTES.LEAVE,       color: '#16a34a', bg: '#f0fdf4' },
  { icon: 'cash-outline',          label: 'Payroll',     route: ROUTES.PAYROLL,     color: '#d97706', bg: '#fffbeb' },
  { icon: 'briefcase-outline',     label: 'Recruitment', route: ROUTES.RECRUITMENT, color: '#db2777', bg: '#fdf2f8' },
  { icon: 'bar-chart-outline',     label: 'Reports',     route: ROUTES.REPORTS,     color: '#0891b2', bg: '#ecfeff' },
];

const QUICK_ACTIONS_EMP = [
  { icon: 'finger-print-outline',  label: 'Check In/Out', route: ROUTES.ATTENDANCE,  color: COLORS.primary, bg: COLORS.primaryLight },
  { icon: 'document-text-outline', label: 'Apply Leave',  route: ROUTES.LEAVE_APPLY, color: '#16a34a',      bg: '#f0fdf4' },
  { icon: 'cash-outline',          label: 'Payslips',     route: ROUTES.PAYROLL,     color: '#d97706',      bg: '#fffbeb' },
  { icon: 'help-circle-outline',   label: 'Helpdesk',     route: ROUTES.HELPDESK,    color: '#7c3aed',      bg: '#f5f3ff' },
  { icon: 'folder-outline',        label: 'Documents',    route: ROUTES.DOCUMENTS,   color: '#0284c7',      bg: '#f0f9ff' },
  { icon: 'person-outline',        label: 'My Profile',   route: ROUTES.PROFILE,     color: '#db2777',      bg: '#fdf2f8' },
];

export default function DashboardScreen({ navigation }) {
  const { user, isAdmin, canManage } = useAuth();
  const insets = useSafeAreaInsets();

  // Admin stats (from /dashboard/stats + /dashboard/attendance)
  const [orgStats,    setOrgStats]    = useState(null);  // employees_count, companies_count, open_jobs_count …
  const [attnStats,   setAttnStats]   = useState(null);  // present_today, on_leave_today, late_today …
  const [activities,  setActivities]  = useState([]);

  // Employee stats (personal)
  const [todayRecord,  setTodayRecord]  = useState(null);  // check_in, check_out …
  const [leaveBalance, setLeaveBalance] = useState([]);    // array of { leave_type_name, balance, availed … }

  const [refreshing, setRefreshing] = useState(false);
  const [greeting,   setGreeting]   = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
  }, []);

  const fetchData = useCallback(async () => {
    if (canManage) {
      // ── Admin / Manager dashboard ─────────────────────────────────────
      const today = new Date().toISOString().slice(0, 10);
      const [statsR, attnR, activitiesR, todayR] = await Promise.allSettled([
        dashboardApi.stats(),                          // sp_dashboard_stats
        dashboardApi.attendanceDash(today),            // sp_attendance_dashboard
        dashboardApi.recentActivities(),               // sp_recent_activities
        attendanceApi.today(),                         // personal check-in status
      ]);
      if (statsR.status === 'fulfilled')      setOrgStats(statsR.value);
      if (attnR.status === 'fulfilled')       setAttnStats(attnR.value);
      if (activitiesR.status === 'fulfilled') setActivities(Array.isArray(activitiesR.value) ? activitiesR.value : []);
      if (todayR.status === 'fulfilled')      setTodayRecord(todayR.value);
    } else {
      // ── Employee dashboard ───────────────────────────────────────────
      const [todayR, balanceR] = await Promise.allSettled([
        attendanceApi.today(),
        leaveApi.balance(),
      ]);
      if (todayR.status === 'fulfilled')   setTodayRecord(todayR.value);
      if (balanceR.status === 'fulfilled') {
        const bal = balanceR.value;
        setLeaveBalance(Array.isArray(bal) ? bal : (bal?.balances ?? []));
      }
    }
  }, [canManage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // ── Derived values ──────────────────────────────────────────────────
  const quickActions = canManage ? QUICK_ACTIONS_ADMIN : QUICK_ACTIONS_EMP;
  const name = user?.first_name || user?.name?.split(' ')[0] || 'User';

  // Admin stat values — backend field names from sp_dashboard_stats / sp_attendance_dashboard
  const totalEmployees = orgStats?.employees_count  ?? orgStats?.totalEmployees  ?? '—';
  const presentToday   = attnStats?.present_today   ?? attnStats?.presentToday   ?? '—';
  const onLeaveToday   = attnStats?.on_leave_today  ?? attnStats?.onLeave        ?? '—';
  const openPositions  = orgStats?.open_jobs_count  ?? orgStats?.openPositions   ?? '—';
  const pendingLeaves  = orgStats?.pending_leaves_count ?? '—';
  const lateToday      = attnStats?.late_today      ?? '—';
  const attendanceRate = (typeof presentToday === 'number' && typeof totalEmployees === 'number' && totalEmployees > 0)
    ? Math.round(presentToday / totalEmployees * 100) + '%'
    : '—';

  // Employee leave balance — find annual leave type
  const annualLeave = leaveBalance.find(b =>
    /annual/i.test(b.leave_type_name)
  );
  const sickLeave = leaveBalance.find(b =>
    /sick/i.test(b.leave_type_name)
  );
  const totalLeaveBalance = leaveBalance.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header Banner ─────────────────────────────────────────── */}
      <LinearGradient
        colors={['#1a1a2e', '#2d1b69', '#f18200']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.banner, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.bannerRow}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userRole}>{user?.designation_name || user?.role_name || 'Employee'}</Text>
          </View>
          <View style={styles.avatarBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(name)}</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Attendance Card */}
        <View style={styles.attnCard}>
          <View style={styles.attnLeft}>
            <Text style={styles.attnLabel}>Today's Status</Text>
            <Text style={[styles.attnStatus, { color: todayRecord?.check_in ? COLORS.success : COLORS.warning }]}>
              {todayRecord?.check_in ? '● Present' : '○ Not Checked In'}
            </Text>
            {todayRecord?.check_in && (
              <Text style={styles.attnTime}>In: {formatTime(todayRecord.check_in)}</Text>
            )}
            {todayRecord?.check_out && (
              <Text style={styles.attnTime}>Out: {formatTime(todayRecord.check_out)}</Text>
            )}
          </View>
          <View style={styles.attnRight}>
            <Text style={styles.attnDate}>{formatDate(new Date())}</Text>
            {!todayRecord?.check_in && (
              <TouchableOpacity
                style={styles.checkInBtn}
                onPress={() => navigation.navigate(ROUTES.ATTENDANCE)}
              >
                <Text style={styles.checkInBtnText}>Check In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* ── Stats Section ──────────────────────────────────────── */}
        {canManage ? (
          <View>
            <Text style={styles.sectionTitle}>Organisation Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard label="Total Employees" value={totalEmployees} icon="people-outline"          color="#7c3aed" style={{ flex: 1 }} />
                <StatCard label="Present Today"   value={presentToday}   icon="checkmark-circle-outline" color={COLORS.success} style={{ flex: 1, marginLeft: 10 }} />
              </View>
              <View style={[styles.statsRow, { marginTop: 10 }]}>
                <StatCard label="On Leave"       value={onLeaveToday}  icon="calendar-outline"   color={COLORS.warning} style={{ flex: 1 }} />
                <StatCard label="Late Today"     value={lateToday}     icon="time-outline"       color={COLORS.danger}  style={{ flex: 1, marginLeft: 10 }} />
              </View>
              <View style={[styles.statsRow, { marginTop: 10 }]}>
                <StatCard label="Open Positions" value={openPositions}  icon="briefcase-outline"  color={COLORS.info}    style={{ flex: 1 }} />
                <StatCard label="Pending Leaves" value={pendingLeaves}  icon="hourglass-outline"  color="#d97706"        style={{ flex: 1, marginLeft: 10 }} />
              </View>
              {typeof presentToday === 'number' && (
                <View style={styles.rateCard}>
                  <Text style={styles.rateLabel}>Attendance Rate Today</Text>
                  <Text style={styles.rateValue}>{attendanceRate}</Text>
                </View>
              )}
            </View>

            {/* Recent Activities */}
            {activities.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {activities.slice(0, 5).map((a, i) => (
                  <View key={a.id ?? i} style={styles.activityRow}>
                    <View style={styles.activityDot} />
                    <Text style={styles.activityText} numberOfLines={1}>
                      {a.performed_by_name || 'System'} {(a.action || '').toLowerCase()} {a.entity}
                      {a.entity_id ? ` #${a.entity_id}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>My Leave Balance</Text>
            {leaveBalance.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {leaveBalance.map((lb) => (
                  <View key={lb.leave_type_id ?? lb.leave_type_name} style={styles.leaveCard}>
                    <Text style={styles.leaveTypeName} numberOfLines={1}>{lb.leave_type_name}</Text>
                    <Text style={styles.leaveBalance}>{lb.balance ?? 0}</Text>
                    <Text style={styles.leaveAvailed}>Used: {lb.availed ?? 0}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.statsRow}>
                <StatCard label="Today's Status" value={todayRecord?.status || '—'} icon="finger-print-outline" color={COLORS.primary} style={{ flex: 1 }} />
                <StatCard label="Work Hours"     value={todayRecord?.work_hours ? `${todayRecord.work_hours}h` : '—'} icon="time-outline" color={COLORS.success} style={{ flex: 1, marginLeft: 10 }} />
              </View>
            )}
          </View>
        )}

        {/* ── Quick Actions ──────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionItem, SHADOW.small]}
              onPress={() => navigation.navigate(action.route)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  banner: { padding: 20, paddingBottom: 32 },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  userRole: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  avatarBox: { alignItems: 'center', gap: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  notifBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  attnCard: { marginTop: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  attnLeft: {},
  attnLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  attnStatus: { fontSize: 15, fontWeight: '700' },
  attnTime: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  attnRight: { alignItems: 'flex-end' },
  attnDate: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  checkInBtn: { marginTop: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  checkInBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  body: { padding: 16, marginTop: -16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  statsGrid: {},
  statsRow: { flexDirection: 'row' },
  rateCard: { marginTop: 10, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray100 },
  rateLabel: { fontSize: 13, color: COLORS.gray600, fontWeight: '600' },
  rateValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 10 },
  activityText: { fontSize: 13, color: COLORS.gray600, flex: 1 },
  leaveCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginRight: 10, minWidth: 110, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray100, ...SHADOW.small },
  leaveTypeName: { fontSize: 11, color: COLORS.gray500, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  leaveBalance: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  leaveAvailed: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionItem: { width: (width - 52) / 3, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray100 },
  actionIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray700, textAlign: 'center' },
});
