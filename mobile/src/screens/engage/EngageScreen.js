import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { engageApi } from '../../api/engage.api';
import { timeAgo } from '../../utils/formatters';

const TABS = ['Announcements', 'Polls', 'Events'];

export default function EngageScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Announcements');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      let res;
      if (tab === 'Events') {
        res = await engageApi.events();
      } else {
        res = await engageApi.dashboard();
      }
      setData(Array.isArray(res) ? res : (res?.items || res?.events || []));
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(activeTab); }, [activeTab]);

  const votePoll = async (pollId, optionId) => {
    // Polling not yet implemented in backend
    fetchData('Events');
  };

  const renderAnnouncement = (item) => (
    <View style={styles.card} key={item.id}>
      <LinearGradient colors={[COLORS.primary + '20', COLORS.primary + '05']} style={styles.announcementBanner}>
        <Ionicons name="megaphone-outline" size={20} color={COLORS.primary} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementDate}>{timeAgo(item.created_at)}</Text>
        </View>
      </LinearGradient>
      <Text style={styles.announcementBody}>{item.content || item.body}</Text>
      {item.author && <Text style={styles.announcementAuthor}>— {item.author}</Text>}
    </View>
  );

  const renderPoll = (item) => {
    const total = (item.options || []).reduce((s, o) => s + (o.votes || 0), 0);
    return (
      <View style={styles.card} key={item.id}>
        <View style={styles.pollHeader}>
          <Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />
          <Text style={styles.pollQuestion}>{item.question || item.title}</Text>
        </View>
        {(item.options || []).map((opt, i) => {
          const pct = total > 0 ? Math.round((opt.votes || 0) / total * 100) : 0;
          const voted = item.my_vote === opt.id;
          return (
            <TouchableOpacity key={i} style={[styles.pollOption, voted && styles.pollOptionVoted]} onPress={() => !item.my_vote && votePoll(item.id, opt.id)}>
              <Text style={[styles.pollOptionText, voted && { color: COLORS.primary }]}>{opt.label || opt.text}</Text>
              <View style={styles.pollBar}><View style={[styles.pollFill, { width: `${pct}%`, backgroundColor: voted ? COLORS.primary : COLORS.gray300 }]} /></View>
              <Text style={styles.pollPct}>{pct}%</Text>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.pollTotal}>{total} vote{total !== 1 ? 's' : ''} · {item.expires_at ? `Ends ${item.expires_at}` : 'Open'}</Text>
      </View>
    );
  };

  const renderEvent = (item) => (
    <TouchableOpacity style={styles.eventCard} key={item.id}>
      <View style={styles.eventDate}>
        <Text style={styles.eventDay}>{new Date(item.event_date || item.date).getDate()}</Text>
        <Text style={styles.eventMon}>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(item.event_date || item.date).getMonth()]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventLocation}><Ionicons name="location-outline" size={12} /> {item.location || 'Online'}</Text>
        {item.time && <Text style={styles.eventTime}><Ionicons name="time-outline" size={12} /> {item.time}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Engage</Text>
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
        data={data}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchData(activeTab)} colors={[COLORS.primary]} />}
        renderItem={({ item }) => activeTab === 'Announcements' ? renderAnnouncement(item) : activeTab === 'Polls' ? renderPoll(item) : renderEvent(item)}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="heart-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No {activeTab.toLowerCase()} yet</Text></View>}
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
  card: { backgroundColor: COLORS.white, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  announcementBanner: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  announcementTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  announcementDate: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  announcementBody: { fontSize: 14, color: COLORS.gray600, lineHeight: 22, padding: 12, paddingTop: 0 },
  announcementAuthor: { fontSize: 12, color: COLORS.gray400, padding: 12, paddingTop: 0, fontStyle: 'italic' },
  pollHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, paddingBottom: 10 },
  pollQuestion: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  pollOption: { marginHorizontal: 14, marginBottom: 8, padding: 10, borderRadius: 8, backgroundColor: COLORS.gray50 },
  pollOptionVoted: { backgroundColor: COLORS.primary + '10', borderWidth: 1, borderColor: COLORS.primary + '40' },
  pollOptionText: { fontSize: 13, color: COLORS.secondary, marginBottom: 6, fontWeight: '500' },
  pollBar: { height: 6, backgroundColor: COLORS.gray200, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  pollFill: { height: '100%', borderRadius: 3 },
  pollPct: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', textAlign: 'right' },
  pollTotal: { fontSize: 12, color: COLORS.gray400, padding: 14, paddingTop: 6 },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  eventDate: { width: 48, height: 52, backgroundColor: COLORS.primary + '15', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  eventDay: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  eventMon: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  eventTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, marginBottom: 4 },
  eventLocation: { fontSize: 12, color: COLORS.gray500 },
  eventTime: { fontSize: 12, color: COLORS.gray500 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
