import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOW } from '../../constants/colors';
import { getInitials } from '../../utils/formatters';
import { ROUTES } from '../../constants/routes';

const MenuItem = ({ icon, label, onPress, color = COLORS.text, danger = false }) => (
  <TouchableOpacity style={[styles.menuItem, SHADOW.small]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.menuIcon, { backgroundColor: danger ? COLORS.dangerLight : COLORS.gray50 }]}>
      <Ionicons name={icon} size={20} color={danger ? COLORS.danger : color} />
    </View>
    <Text style={[styles.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
    {!danger && <Ionicons name="chevron-forward" size={16} color={COLORS.gray300} />}
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, isAdmin, isHRManager, isTL } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';
  const role = user?.designation_name || user?.role_name || 'Employee';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try { await logout(); } catch (_) {}
        }
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Profile Banner */}
      <LinearGradient colors={['#1a1a2e', '#f18200']} style={[styles.banner, { paddingTop: insets.top + 20 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.avatarLg}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileRole}>{role}</Text>
        {user?.department_name && (
          <View style={styles.deptTag}>
            <Ionicons name="business-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.deptText}>{user.department_name}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Info Cards */}
      <View style={styles.infoRow}>
        {[
          { label: 'Employee ID', value: user?.emp_code || '—', icon: 'card-outline' },
          { label: 'Email', value: user?.email || '—', icon: 'mail-outline' },
          { label: 'Phone', value: user?.phone || '—', icon: 'call-outline' },
        ].map(item => (
          <View key={item.label} style={[styles.infoCard, SHADOW.small]}>
            <Ionicons name={item.icon} size={16} color={COLORS.primary} style={{ marginBottom: 6 }} />
            <Text style={styles.infoValue} numberOfLines={1}>{item.value}</Text>
            <Text style={styles.infoLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Account</Text>
        <MenuItem icon="person-outline" label="Edit Profile" onPress={() => {}} color={COLORS.primary} />
        <MenuItem icon="lock-closed-outline" label="Change Password" onPress={() => navigation.navigate(ROUTES.CHANGE_PASSWORD)} color="#7c3aed" />
        <MenuItem icon="notifications-outline" label="Notification Preferences" onPress={() => {}} color="#0284c7" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work</Text>
        <MenuItem icon="document-text-outline" label="My Documents" onPress={() => navigation.navigate(ROUTES.DOCUMENTS)} color="#16a34a" />
        <MenuItem icon="cash-outline" label="Payslips" onPress={() => navigation.navigate(ROUTES.PAYROLL)} color="#d97706" />
        <MenuItem icon="calendar-outline" label="Leave History" onPress={() => navigation.navigate(ROUTES.LEAVE)} color={COLORS.primary} />
        <MenuItem icon="time-outline" label="Attendance History" onPress={() => navigation.navigate(ROUTES.ATTENDANCE_HISTORY)} color="#0891b2" />
      </View>

      {(isAdmin || isHRManager) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration</Text>
          <MenuItem icon="settings-outline" label="System Settings" onPress={() => {}} color="#374151" />
          <MenuItem icon="shield-checkmark-outline" label="Audit Logs" onPress={() => {}} color="#7c3aed" />
        </View>
      )}

      <View style={styles.section}>
        <MenuItem icon="log-out-outline" label={loggingOut ? 'Signing out…' : 'Sign Out'} onPress={handleLogout} danger />
      </View>

      <Text style={styles.version}>NAT IT HRMS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  banner: { padding: 24, paddingBottom: 36, alignItems: 'center' },
  avatarLg: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  profileName: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  profileRole: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  deptTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  deptText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  infoRow: { flexDirection: 'row', gap: 10, padding: 16, marginTop: -16 },
  infoCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.gray100 },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  infoLabel: { fontSize: 10, color: COLORS.textMuted },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: COLORS.gray100 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.gray400, padding: 20 },
});
