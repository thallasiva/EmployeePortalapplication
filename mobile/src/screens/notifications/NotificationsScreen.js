import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationsApi } from '../../api/notifications.api';
import { COLORS, SHADOW } from '../../constants/colors';
import { timeAgo } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TYPE_META = {
  leave: { icon: 'calendar-outline', color: '#16a34a', bg: '#f0fdf4' },
  attendance: { icon: 'finger-print-outline', color: COLORS.primary, bg: COLORS.primaryLight },
  payroll: { icon: 'cash-outline', color: '#d97706', bg: '#fffbeb' },
  system: { icon: 'settings-outline', color: '#374151', bg: COLORS.gray100 },
  recruitment: { icon: 'briefcase-outline', color: '#7c3aed', bg: '#f5f3ff' },
};

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list({ limit: 50 });
      setNotifications(Array.isArray(res) ? res : res?.data || res?.notifications || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (_) {}
  };

  const onRefresh = async () => { setRefreshing(true); await fetchNotifications(); setRefreshing(false); };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderItem = ({ item }) => {
    const meta = TYPE_META[item.type] || TYPE_META.system;
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.is_read && styles.unread, SHADOW.small]}
        onPress={() => { if (!item.is_read) markRead(item.id); }}
        activeOpacity={0.8}
      >
        <View style={[styles.notifIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={styles.notifBody}>
          <Text style={[styles.notifTitle, !item.is_read && styles.unreadText]}>{item.title}</Text>
          {item.message && <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>}
          <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.unreadCount}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, i) => String(item.id || i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 120, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="notifications-outline" title="No notifications" subtitle="You're all caught up!" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  unreadCount: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 1 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.primaryLight, borderRadius: 20 },
  markAllText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.gray100, gap: 12 },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  notifIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  unreadText: { fontWeight: '700' },
  notifMsg: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 6 },
  notifTime: { fontSize: 11, color: COLORS.gray400 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
});
