import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { appraisalApi } from '../../api/appraisal.api';

const RatingBar = ({ label, value, max = 5 }) => (
  <View style={styles.ratingRow}>
    <Text style={styles.ratingLabel}>{label}</Text>
    <View style={styles.ratingBar}>
      <View style={[styles.ratingFill, { width: `${(value / max) * 100}%` }]} />
    </View>
    <Text style={styles.ratingVal}>{value}/{max}</Text>
  </View>
);

export default function AppraisalScreen({ navigation }) {
  const [appraisals, setAppraisals] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  const fetchAppraisals = async () => {
    setLoading(true);
    try {
      const res = await appraisalApi.my();
      const all = res.data?.appraisals || res.data || [];
      setAppraisals(all);
      setCurrent(all.find(a => a.status === 'active' || a.status === 'pending') || all[0] || null);
    } catch { setAppraisals([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAppraisals(); }, []);

  const getRatingColor = (val, max = 5) => {
    const pct = val / max;
    if (pct >= 0.8) return COLORS.success;
    if (pct >= 0.6) return COLORS.warning;
    return COLORS.danger;
  };

  const renderCurrent = () => {
    if (!current) return <View style={styles.empty}><Ionicons name="ribbon-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No active appraisal cycle</Text></View>;
    const ratings = current.ratings || current.category_ratings || {};
    const overall = current.overall_rating || current.rating || 0;
    return (
      <View>
        <LinearGradient colors={['#1a2535', '#2d3748']} style={styles.appraisalBanner}>
          <Text style={styles.cycleName}>{current.cycle_name || current.period || 'Appraisal'}</Text>
          <Text style={styles.overallRating}>{overall}</Text>
          <Text style={styles.overallLabel}>Overall Rating</Text>
          <View style={[styles.statusBadge, { backgroundColor: current.status === 'completed' ? COLORS.success + '30' : COLORS.warning + '30' }]}>
            <Text style={[styles.statusText, { color: current.status === 'completed' ? COLORS.success : COLORS.warning }]}>{current.status?.replace('_', ' ')}</Text>
          </View>
        </LinearGradient>
        {Object.keys(ratings).length > 0 && (
          <View style={styles.ratingsCard}>
            <Text style={styles.cardTitle}>Performance Breakdown</Text>
            {Object.entries(ratings).map(([k, v]) => (
              <RatingBar key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={Number(v)} />
            ))}
          </View>
        )}
        {current.manager_feedback && (
          <View style={styles.feedbackCard}>
            <Text style={styles.cardTitle}>Manager Feedback</Text>
            <Text style={styles.feedbackText}>{current.manager_feedback}</Text>
          </View>
        )}
        {current.goals && current.goals.length > 0 && (
          <View style={styles.goalsCard}>
            <Text style={styles.cardTitle}>Goals</Text>
            {current.goals.map((g, i) => (
              <View key={i} style={styles.goalRow}>
                <Ionicons name={g.achieved ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={g.achieved ? COLORS.success : COLORS.gray300} />
                <Text style={styles.goalText}>{g.title || g.goal}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderHistory = () => (
    <View style={styles.historyList}>
      {appraisals.filter(a => a.status === 'completed').map((a, i) => (
        <TouchableOpacity key={i} style={styles.historyCard} activeOpacity={0.8} onPress={() => navigation.navigate('AppraisalDetail', { appraisalId: a.id || a.appraisal_id })}>
          <View style={{ flex: 1 }}>
            <Text style={styles.historyPeriod}>{a.cycle_name || a.period}</Text>
            <Text style={styles.historyDate}>{a.review_date || a.completed_date}</Text>
          </View>
          <View style={[styles.ratingCircle, { backgroundColor: getRatingColor(a.overall_rating || a.rating) + '20' }]}>
            <Text style={[styles.ratingCircleText, { color: getRatingColor(a.overall_rating || a.rating) }]}>{a.overall_rating || a.rating}</Text>
          </View>
        </TouchableOpacity>
      ))}
      {appraisals.filter(a => a.status === 'completed').length === 0 && (
        <View style={styles.empty}><Text style={styles.emptyText}>No completed appraisals</Text></View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Appraisals</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.tabBar}>
        {['current', 'history'].map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAppraisals} colors={[COLORS.primary]} />}>
          {activeTab === 'current' ? renderCurrent() : renderHistory()}
        </ScrollView>
      )}
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
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.primary },
  appraisalBanner: { margin: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  cycleName: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },
  overallRating: { fontSize: 48, fontWeight: '900', color: COLORS.primary },
  overallLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  ratingsCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  ratingLabel: { fontSize: 13, color: COLORS.gray600, width: 120 },
  ratingBar: { flex: 1, height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
  ratingFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  ratingVal: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, width: 32, textAlign: 'right' },
  feedbackCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  feedbackText: { fontSize: 14, color: COLORS.gray600, lineHeight: 22, fontStyle: 'italic' },
  goalsCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  goalText: { fontSize: 13, color: COLORS.secondary },
  historyList: { padding: 16, gap: 10 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  historyPeriod: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  historyDate: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  ratingCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  ratingCircleText: { fontSize: 18, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
