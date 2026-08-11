import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const STAGES = ['Applied', 'Screening', 'Interview', 'Technical', 'HR Round', 'Offer', 'Hired', 'Rejected'];
const STAGE_COLORS = { Hired: COLORS.success, Rejected: COLORS.danger, Offer: '#7c3aed', Interview: COLORS.primary, 'HR Round': '#0891b2' };

export default function CandidateDetailScreen({ navigation, route }) {
  const { candidateId } = route.params || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await client.get(`/recruitment/candidates/${candidateId}`);
        setData(r.data?.data ?? r.data);
      } catch { setData(null); }
      finally { setLoading(false); }
    };
    if (candidateId) load();
  }, [candidateId]);

  const moveStage = (stage) => {
    Alert.alert('Move Stage', `Move candidate to "${stage}"?`, [
      { text: 'Cancel' },
      { text: 'Move', onPress: async () => {
        setUpdating(true);
        try {
          await client.put(`/recruitment/candidates/${candidateId}`, { stage });
          setData(p => ({ ...p, stage }));
        } catch { Alert.alert('Error', 'Could not update stage'); }
        finally { setUpdating(false); }
      }},
    ]);
  };

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!data) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><Text>Candidate not found</Text></View>;

  const stageColor = STAGE_COLORS[data.stage] || COLORS.gray400;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Candidate Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{(data.name || '?')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.position}>{data.position || data.job_title || ''}</Text>
          <View style={[styles.stagePill, { backgroundColor: stageColor + '20' }]}>
            <Text style={[styles.stageTxt, { color: stageColor }]}>{data.stage || 'Applied'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Info</Text>
          <View style={styles.card}>
            {data.email && <ContactRow icon="mail-outline" value={data.email} />}
            {data.phone && <ContactRow icon="call-outline" value={data.phone} />}
            {data.location && <ContactRow icon="location-outline" value={data.location} />}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <InfoRow label="Experience" value={data.experience || data.years_experience ? `${data.experience || data.years_experience} years` : '—'} />
            <InfoRow label="Current CTC" value={data.current_ctc || '—'} />
            <InfoRow label="Expected CTC" value={data.expected_ctc || '—'} />
            <InfoRow label="Notice Period" value={data.notice_period ? `${data.notice_period} days` : '—'} />
            <InfoRow label="Source" value={data.source || '—'} />
            <InfoRow label="Applied On" value={data.applied_date ? new Date(data.applied_date).toLocaleDateString() : '—'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Move to Stage</Text>
          <View style={styles.stagesGrid}>
            {STAGES.map(s => (
              <TouchableOpacity key={s} onPress={() => moveStage(s)} disabled={updating || s === data.stage}
                style={[styles.stageBtn, s === data.stage && styles.stageBtnActive]}>
                <Text style={[styles.stageBtnTxt, s === data.stage && styles.stageBtnTxtActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ContactRow = ({ icon, value }) => (
  <View style={styles.contactRow}>
    <Ionicons name={icon} size={16} color={COLORS.primary} />
    <Text style={styles.contactTxt}>{value}</Text>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  back: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  profileCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 20, alignItems: 'center', gap: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 30, fontWeight: '900', color: COLORS.primary },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  position: { fontSize: 13, color: COLORS.gray500 },
  stagePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  stageTxt: { fontSize: 12, fontWeight: '700' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, gap: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactTxt: { fontSize: 14, color: COLORS.secondary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 13, color: COLORS.gray500 },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },
  stagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stageBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray100 },
  stageBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stageBtnTxt: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
  stageBtnTxtActive: { color: COLORS.white },
});
