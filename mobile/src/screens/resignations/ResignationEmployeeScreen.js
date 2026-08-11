import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';
import DatePickerField from '../../components/DatePickerField';

const unwrap = r => r.data?.data ?? r.data;

export default function ResignationEmployeeScreen({ navigation }) {
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ reason: '', last_working_date: '', notice_period: '30' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/resignations/my').then(unwrap)
      .then(data => setExisting(Array.isArray(data) ? data[0] : data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!form.reason.trim()) { Alert.alert('Required', 'Please provide a reason'); return; }
    Alert.alert('Confirm Resignation', 'Are you sure you want to submit your resignation? This cannot be undone.',
      [{ text: 'Cancel', style: 'cancel' },
       { text: 'Submit', style: 'destructive', onPress: async () => {
          setSubmitting(true);
          try {
            await client.post('/resignations', form);
            Alert.alert('Submitted', 'Your resignation has been submitted. HR will review it shortly.');
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to submit');
          } finally { setSubmitting(false); }
        }
      }]
    );
  };

  const STATUS_COLOR = { pending: '#f59e0b', approved: '#059669', rejected: '#ef4444', withdrawn: COLORS.gray400 };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resignation</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {existing ? (
          <View>
            <View style={[styles.statusCard, { borderColor: STATUS_COLOR[existing.status] || COLORS.gray200 }]}>
              <Ionicons name="document-text-outline" size={36} color={STATUS_COLOR[existing.status] || COLORS.gray400} />
              <Text style={styles.statusTitle}>Resignation Submitted</Text>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[existing.status] || COLORS.gray400) + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[existing.status] || COLORS.gray500 }]}>
                  {existing.status?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.infoRow}><Text style={styles.infoLabel}>Last Working Date: </Text>{existing.last_working_date || 'TBD'}</Text>
              <Text style={styles.infoRow}><Text style={styles.infoLabel}>Notice Period: </Text>{existing.notice_period || 30} days</Text>
              <Text style={styles.infoRow}><Text style={styles.infoLabel}>Reason: </Text>{existing.reason}</Text>
            </View>
            {existing.status === 'pending' && (
              <TouchableOpacity onPress={async () => {
                try {
                  await client.put(`/resignations/${existing.id}/withdraw`);
                  Alert.alert('Withdrawn', 'Your resignation has been withdrawn.');
                  setExisting(null);
                } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to withdraw'); }
              }} style={styles.withdrawBtn}>
                <Text style={styles.withdrawText}>Withdraw Resignation</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ gap: 18 }}>
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={20} color='#f59e0b' />
              <Text style={styles.warningText}>Please review your company's resignation policy before submitting. You are required to serve a notice period as per your employment agreement.</Text>
            </View>
            <View>
              <Text style={styles.fieldLabel}>Reason for Resignation *</Text>
              <TextInput style={styles.textArea} value={form.reason} onChangeText={v => setForm(f => ({ ...f, reason: v }))}
                placeholder="Please describe your reason for leaving..." multiline numberOfLines={5} placeholderTextColor={COLORS.gray300} />
            </View>
            <DatePickerField label="Preferred Last Working Date" value={form.last_working_date} onChange={v => setForm(f => ({ ...f, last_working_date: v }))} />
            <View>
              <Text style={styles.fieldLabel}>Notice Period (days)</Text>
              <TextInput style={styles.input} value={form.notice_period} onChangeText={v => setForm(f => ({ ...f, notice_period: v }))}
                keyboardType="numeric" placeholder="30" placeholderTextColor={COLORS.gray300} />
            </View>
            <TouchableOpacity onPress={submit} disabled={submitting} style={styles.submitBtn}>
              {submitting ? <ActivityIndicator color={COLORS.white} /> : (
                <>
                  <Ionicons name="exit-outline" size={20} color={COLORS.white} />
                  <Text style={styles.submitText}>Submit Resignation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center', gap: 10, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statusTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  infoRow: { fontSize: 14, color: COLORS.gray500, textAlign: 'center' },
  infoLabel: { fontWeight: '700', color: COLORS.secondary },
  warningBox: { flexDirection: 'row', gap: 10, backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 19 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray500, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary },
  textArea: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary, minHeight: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.danger, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  withdrawBtn: { marginTop: 16, borderWidth: 1.5, borderColor: COLORS.danger, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  withdrawText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
});
