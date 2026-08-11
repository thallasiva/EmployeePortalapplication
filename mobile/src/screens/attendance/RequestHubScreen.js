import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';
import DatePickerField from '../../components/DatePickerField';

const unwrap = r => r.data?.data ?? r.data;

const REQUEST_TYPES = [
  { key: 'wfh', label: 'Work From Home', icon: 'home-outline', color: '#0891b2' },
  { key: 'regularization', label: 'Regularization', icon: 'finger-print-outline', color: '#059669' },
  { key: 'comp_off', label: 'Comp Off', icon: 'swap-horizontal-outline', color: '#7c3aed' },
  { key: 'short_leave', label: 'Short Leave', icon: 'time-outline', color: '#f59e0b' },
];

const STATUS_COLOR = { pending: '#f59e0b', approved: '#059669', rejected: '#ef4444', cancelled: COLORS.gray400 };

export default function RequestHubScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'wfh', date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    client.get('/attendance/requests/my').then(unwrap)
      .then(res => setRequests(Array.isArray(res) ? res : (res?.rows || [])))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const submit = async () => {
    if (!form.date || !form.reason.trim()) { Alert.alert('Required', 'Please fill date and reason'); return; }
    setSubmitting(true);
    try {
      await client.post('/attendance/requests', { request_type: form.type, date: form.date, reason: form.reason });
      Alert.alert('Success', 'Request submitted successfully');
      setShowModal(false);
      setForm({ type: 'wfh', date: '', reason: '' });
      fetchRequests();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit request');
    } finally { setSubmitting(false); }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Ionicons name={REQUEST_TYPES.find(t => t.key === item.request_type)?.icon || 'document-outline'} size={22}
          color={REQUEST_TYPES.find(t => t.key === item.request_type)?.color || COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardType}>{REQUEST_TYPES.find(t => t.key === item.request_type)?.label || item.request_type}</Text>
        <Text style={styles.cardDate}>{item.date || item.request_date}</Text>
        <Text style={styles.cardReason} numberOfLines={2}>{item.reason}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[item.status] || COLORS.gray400) + '20' }]}>
        <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] || COLORS.gray400 }]}>
          {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Pending'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Hub</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Quick type buttons */}
      <View style={styles.quickRow}>
        {REQUEST_TYPES.map(t => (
          <TouchableOpacity key={t.key} onPress={() => { setForm(f => ({ ...f, type: t.key })); setShowModal(true); }}
            style={[styles.quickBtn, { backgroundColor: t.color + '15' }]}>
            <Ionicons name={t.icon} size={18} color={t.color} />
            <Text style={[styles.quickLabel, { color: t.color }]}>{t.label.split(' ')[0]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={requests} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="layers-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubText}>Tap + to submit a new request</Text>
            </View>
          } />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={COLORS.secondary} /></TouchableOpacity>
            <Text style={styles.modalTitle}>New Request</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            <Text style={styles.fieldLabel}>Request Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {REQUEST_TYPES.map(t => (
                <TouchableOpacity key={t.key} onPress={() => setForm(f => ({ ...f, type: t.key }))}
                  style={[styles.typeChip, form.type === t.key && { backgroundColor: t.color, borderColor: t.color }]}>
                  <Text style={[styles.typeChipText, form.type === t.key && { color: COLORS.white }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <DatePickerField label="Date *" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <View>
              <Text style={styles.fieldLabel}>Reason *</Text>
              <TextInput style={styles.textArea} value={form.reason} onChangeText={v => setForm(f => ({ ...f, reason: v }))}
                placeholder="Describe your reason..." multiline numberOfLines={4} placeholderTextColor={COLORS.gray300} />
            </View>
            <TouchableOpacity onPress={submit} disabled={submitting} style={styles.submitBtn}>
              {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  quickRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  quickBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 10 },
  quickLabel: { fontSize: 10, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, paddingTop: 60 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardLeft: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  cardType: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  cardDate: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  cardReason: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.gray400, marginTop: 12 },
  emptySubText: { fontSize: 13, color: COLORS.gray300, marginTop: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray500, marginBottom: 6 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.gray200 },
  typeChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  textArea: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary, minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
