import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { attendanceApi } from '../../api/attendance.api';
import { COLORS, SHADOW } from '../../constants/colors';
import { formatDate, formatTime } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../constants/routes';

export default function AttendanceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [todayData, setTodayData] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [today, monthly] = await Promise.allSettled([
        attendanceApi.today(),
        attendanceApi.summary({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
      ]);
      if (today.status === 'fulfilled') setTodayData(today.value);
      if (monthly.status === 'fulfilled') setMonthData(monthly.value);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCheckAction = () => {
    const isCheckedIn = !!todayData?.check_in && !todayData?.check_out;
    const action = isCheckedIn ? 'Check Out' : 'Check In';
    Alert.alert(
      action,
      `Confirm ${action.toLowerCase()} at ${formatTime(new Date())}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: doCheckAction },
      ]
    );
  };

  const doCheckAction = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(true);
    try {
      const isCheckedIn = !!todayData?.check_in && !todayData?.check_out;
      if (isCheckedIn) {
        await attendanceApi.checkOut({ time: new Date().toISOString() });
      } else {
        await attendanceApi.checkIn({ time: new Date().toISOString() });
      }
      await fetchData();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const isCheckedIn = !!todayData?.check_in && !todayData?.check_out;
  const isCompleted = !!todayData?.check_in && !!todayData?.check_out;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#f18200']} style={[styles.header, { paddingTop: insets.top + 16 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerDate}>{formatDate(now, 'dddd, DD MMM YYYY')}</Text>

        {/* Clock */}
        <View style={styles.clockBox}>
          <Text style={styles.clockTime}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
        </View>

        {/* Check In/Out Button */}
        <TouchableOpacity
          style={[styles.checkBtn, { backgroundColor: isCheckedIn ? COLORS.danger : isCompleted ? COLORS.gray400 : COLORS.primary }]}
          onPress={handleCheckAction}
          disabled={actionLoading || isCompleted}
          activeOpacity={0.8}
        >
          <Ionicons name={isCheckedIn ? 'exit-outline' : 'enter-outline'} size={24} color={COLORS.white} />
          <Text style={styles.checkBtnText}>
            {actionLoading ? 'Processing…' : isCompleted ? 'Completed' : isCheckedIn ? 'Check Out' : 'Check In'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        {/* Today Summary */}
        <Card style={styles.todayCard}>
          <Text style={styles.cardTitle}>Today's Attendance</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <View style={[styles.timeIcon, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="log-in-outline" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.timeLabel}>Check In</Text>
              <Text style={styles.timeValue}>{todayData?.check_in ? formatTime(todayData.check_in) : '—'}</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeItem}>
              <View style={[styles.timeIcon, { backgroundColor: COLORS.dangerLight }]}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              </View>
              <Text style={styles.timeLabel}>Check Out</Text>
              <Text style={styles.timeValue}>{todayData?.check_out ? formatTime(todayData.check_out) : '—'}</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeItem}>
              <View style={[styles.timeIcon, { backgroundColor: COLORS.infoLight }]}>
                <Ionicons name="time-outline" size={20} color={COLORS.info} />
              </View>
              <Text style={styles.timeLabel}>Hours</Text>
              <Text style={styles.timeValue}>{todayData?.working_hours ? `${todayData.working_hours}h` : '—'}</Text>
            </View>
          </View>
        </Card>

        {/* Monthly Summary */}
        {monthData && (
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.cardTitle}>This Month</Text>
            <View style={styles.monthGrid}>
              {[
                { label: 'Present', value: monthData.present ?? 0, color: COLORS.success },
                { label: 'Absent', value: monthData.absent ?? 0, color: COLORS.danger },
                { label: 'Late', value: monthData.late ?? 0, color: COLORS.warning },
                { label: 'Leaves', value: monthData.leaves ?? 0, color: COLORS.info },
              ].map(item => (
                <View key={item.label} style={styles.monthItem}>
                  <Text style={[styles.monthValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.monthLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* View History */}
        <TouchableOpacity
          style={[styles.historyBtn, SHADOW.small]}
          onPress={() => navigation.navigate(ROUTES.ATTENDANCE_HISTORY)}
        >
          <View style={styles.historyLeft}>
            <View style={[styles.historyIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="list-outline" size={22} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.historyTitle}>Attendance History</Text>
              <Text style={styles.historySubtitle}>View your full attendance log</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingBottom: 32, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 2 },
  headerDate: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  clockBox: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 28, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  clockTime: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: 2 },
  checkBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 36, paddingVertical: 16, borderRadius: 50, width: '85%', justifyContent: 'center' },
  checkBtnText: { fontSize: 17, fontWeight: '800', color: COLORS.white },
  body: { padding: 16, marginTop: -16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  todayCard: {},
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeItem: { flex: 1, alignItems: 'center' },
  timeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  timeLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  timeValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  timeDivider: { width: 1, height: 60, backgroundColor: COLORS.gray100 },
  monthGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  monthItem: { alignItems: 'center' },
  monthValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  monthLabel: { fontSize: 12, color: COLORS.textMuted },
  historyBtn: { marginTop: 12, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.gray100 },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  historySubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
