import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { worklifeApi } from '../../api/worklife.api';

const REQUEST_TYPES = [
  { id: 'wfh', label: 'Work From Home', icon: 'home-outline', color: '#7c3aed' },
  { id: 'comp_off', label: 'Comp Off', icon: 'gift-outline', color: COLORS.success },
  { id: 'od', label: 'On Duty', icon: 'briefcase-outline', color: COLORS.info },
  { id: 'regularize', label: 'Regularize', icon: 'time-outline', color: COLORS.warning },
  { id: 'shift_change', label: 'Shift Change', icon: 'swap-horizontal-outline', color: COLORS.danger },
];

export default function WorklifeScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'wfh', from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await worklifeApi.myRequests();
      setRequests(res.data?.requests || res.data || []);
    } catch { setRequests([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const submitRequest = async () => {
    if (!form.from_date || !form.reason) { Alert.alert('Required', 'Fill date and reason.'); return; }
    setSubmitting(true);
    try {
      await worklifeApi.create(form);
      Alert.alert('Success', 'Request submitted!');
      setShowForm(false);
      setForm({ type: 'wfh', from_date: '', to_date: '', reason: '' });
      fetchRequests();
    } catch { Alert.alert('Error', 'Submit failed.'); } finally { setSubmitting(false); }
  };

  const getStatusColor = (s) => ({ pending: COLORS.warning, approved: COLORS.success, rejected: COLORS.danger }[s] || COLORS.gray400);
  const getType = (id) => REQUEST_TYPES.find(t => t.id === id) || REQUEST_TYPES[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Work Life Requests</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}><Ionicons name="add" size={22} color={COLORS.white} /></TouchableOpacity>
      </View>

      {/* Request Type Grid */}
      <View style={styles.typeGrid}>
        {REQUEST_TYPES.map(t => (
          <TouchableOpacity key={t.id} style={styles.typeCard} onPress={() => { setForm(f => ({ ...f, type: t.id })); setShowForm(true); }}>
            <View style={[styles.typeIcon, { backgroundColor: t.color + '20' }]}>
              <Ionicons name={t.icon} size={22} color={t.color} />
            </View>
            <Text style={styles.typeLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Requests</Text>
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRequests} colors={[COLORS.primary]} />}
      >
        {!loading && requests.length === 0 && (
          <View style={styles.empty}><Ionicons name="document-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No requests yet</Text></View>
        )}
        {requests.map(item => {
          const type = getType(item.type || item.request_type);
          return (
            <View key={item.id} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: type.color + '20' }]}>
                <Ionicons name={type.icon} size={18} color={type.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{type.label}</Text>
                <Text style={styles.cardDate}>{item.from_date}{item.to_date && item.to_date !== item.from_date ? ` → ${item.to_date}` : ''}</Text>
                <Text style={styles.cardReason} numberOfLines={1}>{item.reason}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Request</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}><Ionicons name="close" size={22} color={COLORS.secondary} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {REQUEST_TYPES.map(t => (
                    <TouchableOpacity key={t.id} onPress={() => setForm(f => ({ ...f, type: t.id }))} style={[styles.typeChip, form.type === t.id && { backgroundColor: t.color + '20', borderColor: t.color }]}>
                      <Ionicons name={t.icon} size={14} color={form.type === t.id ? t.color : COLORS.gray500} />
                      <Text style={[styles.typeChipText, form.type === t.id && { color: t.color }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.inputLabel}>From Date</Text>
              <TextInput style={styles.input} value={form.from_date} onChangeText={v => setForm(f => ({ ...f, from_date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.gray300} />
              <Text style={styles.inputLabel}>To Date (optional)</Text>
              <TextInput style={styles.input} value={form.to_date} onChangeText={v => setForm(f => ({ ...f, to_date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.gray300} />
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput style={[styles.input, styles.textarea]} value={form.reason} onChangeText={v => setForm(f => ({ ...f, reason: v }))} placeholder="Reason for request..." placeholderTextColor={COLORS.gray300} multiline numberOfLines={3} textAlignVertical="top" />
              <TouchableOpacity style={styles.submitBtn} onPress={submitRequest} disabled={submitting}>
                {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Submit Request</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  typeCard: { width: '18%', alignItems: 'center', gap: 6 },
  typeIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeLabel: { fontSize: 10, color: COLORS.gray600, textAlign: 'center', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  cardDate: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  cardReason: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary, marginBottom: 14 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.gray100, borderWidth: 1.5, borderColor: 'transparent' },
  typeChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  submitText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});
