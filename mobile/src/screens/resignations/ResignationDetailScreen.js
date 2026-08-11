import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const STATUS_STYLES = {
  pending:  { bg: '#fef9c3', color: '#854d0e' },
  approved: { bg: '#dcfce7', color: '#166534' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
  withdrawn:{ bg: '#f3f4f6', color: '#6b7280' },
};

const InfoRow = ({ label, value, highlight }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && { color: COLORS.primary, fontWeight: '800' }]}>{value || '—'}</Text>
  </View>
);

export default function ResignationDetailScreen({ navigation, route }) {
  const { resignationId } = route.params || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await client.get(`/resignations/${resignationId}`);
        setData(r.data?.data ?? r.data);
      } catch { setData(null); }
      finally { setLoading(false); }
    };
    if (resignationId) load();
  }, [resignationId]);

  const handleAction = (action) => {
    const label = action === 'approve' ? 'Approve' : 'Reject';
    Alert.alert(`${label} Resignation`, `Are you sure you want to ${action} this resignation?`, [
      { text: 'Cancel' },
      { text: label, style: action === 'reject' ? 'destructive' : 'default',
        onPress: async () => {
          setActing(true);
          try {
            await client.put(`/resignations/${resignationId}/${action}`);
            const r = await client.get(`/resignations/${resignationId}`);
            setData(r.data?.data ?? r.data);
          } catch { Alert.alert('Error', `Could not ${action} resignation`); }
          finally { setActing(false); }
        }
      },
    ]);
  };

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!data) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><Text>Not found</Text></View>;

  const s = STATUS_STYLES[data.status] || STATUS_STYLES.pending;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Resignation Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Employee Card */}
        <View style={styles.empCard}>
          <View style={styles.empAvatar}>
            <Text style={styles.empAvatarTxt}>{(data.employee_name || '?')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.empName}>{data.employee_name || '—'}</Text>
            <Text style={styles.empRole}>{data.designation || data.department || ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusTxt, { color: s.color }]}>{(data.status || 'pending').toUpperCase()}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resignation Info</Text>
          <View style={styles.card}>
            <InfoRow label="Resignation Date" value={data.resignation_date} />
            <InfoRow label="Last Working Day" value={data.last_working_day} highlight />
            <InfoRow label="Notice Period" value={data.notice_period ? `${data.notice_period} days` : '—'} />
            <InfoRow label="Submitted On" value={data.created_at ? new Date(data.created_at).toLocaleDateString() : '—'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason</Text>
          <View style={styles.card}>
            <Text style={styles.reason}>{data.reason || 'No reason provided'}</Text>
          </View>
        </View>

        {data.hr_comments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HR Comments</Text>
            <View style={styles.card}>
              <Text style={styles.reason}>{data.hr_comments}</Text>
            </View>
          </View>
        )}

        {data.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction('reject')} disabled={acting}>
              <Ionicons name="close-circle" size={18} color={COLORS.danger} />
              <Text style={styles.rejectTxt}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction('approve')} disabled={acting}>
              {acting ? <ActivityIndicator size="small" color={COLORS.white} />
                : <><Ionicons name="checkmark-circle" size={18} color={COLORS.white} /><Text style={styles.approveTxt}>Approve</Text></>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  back: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  empCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, gap: 12 },
  empAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  empAvatarTxt: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  empName: { fontSize: 15, fontWeight: '800', color: COLORS.secondary },
  empRole: { fontSize: 12, color: COLORS.gray500 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 13, color: COLORS.gray500 },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },
  reason: { fontSize: 14, color: COLORS.gray600 || COLORS.gray500, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.danger + '40', backgroundColor: COLORS.danger + '08' },
  rejectTxt: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.success },
  approveTxt: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
