import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const Tag = ({ label, color }) => (
  <View style={[styles.tag, { backgroundColor: (color || COLORS.primary) + '18' }]}>
    <Text style={[styles.tagTxt, { color: color || COLORS.primary }]}>{label}</Text>
  </View>
);

export default function JobDetailScreen({ navigation, route }) {
  const { jobId } = route.params || {};
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [j, c] = await Promise.all([
          client.get(`/recruitment/jobs/${jobId}`).then(r => r.data?.data ?? r.data),
          client.get(`/recruitment/jobs/${jobId}/candidates`).then(r => r.data?.data ?? r.data ?? []).catch(() => []),
        ]);
        setJob(j);
        setCandidates(Array.isArray(c) ? c : []);
      } catch { setJob(null); }
      finally { setLoading(false); }
    };
    if (jobId) load();
  }, [jobId]);

  const toggleStatus = () => {
    const newStatus = job?.status === 'open' ? 'closed' : 'open';
    Alert.alert(`${newStatus === 'open' ? 'Open' : 'Close'} Job`, `Change job status to ${newStatus}?`, [
      { text: 'Cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await client.put(`/recruitment/jobs/${jobId}`, { status: newStatus });
          setJob(p => ({ ...p, status: newStatus }));
        } catch { Alert.alert('Error', 'Could not update status'); }
      }},
    ]);
  };

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!job) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><Text>Job not found</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{job.title || 'Job Detail'}</Text>
        <TouchableOpacity onPress={toggleStatus} style={[styles.statusBtn, { backgroundColor: job.status === 'open' ? COLORS.success + '15' : COLORS.danger + '15' }]}>
          <Text style={[styles.statusBtnTxt, { color: job.status === 'open' ? COLORS.success : COLORS.danger }]}>
            {job.status === 'open' ? 'Open' : 'Closed'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.heroCard}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.tagsRow}>
            {job.department && <Tag label={job.department} color={COLORS.primary} />}
            {job.job_type && <Tag label={job.job_type} color='#7c3aed' />}
            {job.location && <Tag label={job.location} color='#0891b2' />}
            {job.experience_required && <Tag label={`${job.experience_required} yrs`} color='#059669' />}
          </View>
          <View style={styles.statsRow}>
            <Stat icon="people-outline" value={candidates.length} label="Candidates" color={COLORS.primary} />
            <Stat icon="calendar-outline" value={job.posted_date ? new Date(job.posted_date).toLocaleDateString() : '—'} label="Posted" color='#7c3aed' />
            <Stat icon="time-outline" value={job.deadline ? new Date(job.deadline).toLocaleDateString() : '—'} label="Deadline" color={COLORS.warning} />
          </View>
        </View>

        {job.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.card}><Text style={styles.bodyTxt}>{job.description}</Text></View>
          </View>
        )}
        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <View style={styles.card}><Text style={styles.bodyTxt}>{job.requirements}</Text></View>
          </View>
        )}
        {job.salary_range && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salary Range</Text>
            <View style={styles.card}><Text style={[styles.bodyTxt, { fontWeight: '700', color: COLORS.success }]}>{job.salary_range}</Text></View>
          </View>
        )}

        {candidates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Candidates ({candidates.length})</Text>
            {candidates.slice(0, 5).map((c, i) => (
              <TouchableOpacity key={i} style={styles.candidateRow}
                onPress={() => navigation.navigate('CandidateDetail', { candidateId: c.id })}>
                <View style={styles.cAvatar}>
                  <Text style={styles.cAvatarTxt}>{(c.name || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cName}>{c.name}</Text>
                  <Text style={styles.cStage}>{c.stage || c.status || 'Applied'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray300} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const Stat = ({ icon, value, label, color }) => (
  <View style={styles.stat}>
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBtnTxt: { fontSize: 12, fontWeight: '700' },
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, gap: 12 },
  jobTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagTxt: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  stat: { alignItems: 'center', gap: 4 },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  statLabel: { fontSize: 10, color: COLORS.gray400 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14 },
  bodyTxt: { fontSize: 14, color: COLORS.gray600 || COLORS.gray500, lineHeight: 22 },
  candidateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 10 },
  cAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  cAvatarTxt: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  cName: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  cStage: { fontSize: 11, color: COLORS.gray500 },
});
