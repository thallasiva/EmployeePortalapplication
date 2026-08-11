import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';
import DatePickerField from '../../components/DatePickerField';

const unwrap = r => r.data?.data ?? r.data;

export default function WorkflowDelegatesScreen({ navigation }) {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ delegate_id: '', from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/workflow/delegates/my').then(unwrap)
      .then(res => setDelegates(Array.isArray(res) ? res : (res?.rows || [])))
      .catch(() => setDelegates([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.from_date || !form.to_date) { Alert.alert('Required', 'Please select dates'); return; }
    setSubmitting(true);
    try {
      await client.post('/workflow/delegates', form);
      Alert.alert('Success', 'Delegation created successfully');
      setShowModal(false);
      setForm({ delegate_id: '', from_date: '', to_date: '', reason: '' });
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create delegation');
    } finally { setSubmitting(false); }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name="git-branch-outline" size={22} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.delegate_name || item.delegate?.full_name || 'Delegate'}</Text>
        <Text style={styles.cardSub}>{item.from_date} → {item.to_date}</Text>
        {item.reason && <Text style={styles.cardReason} numberOfLines={1}>{item.reason}</Text>}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#dcfce7' : COLORS.gray100 }]}>
        <Text style={[styles.statusText, { color: item.is_active ? '#059669' : COLORS.gray400 }]}>
          {item.is_active ? 'Active' : 'Inactive'}
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
        <Text style={styles.headerTitle}>Workflow Delegates</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color='#0891b2' />
        <Text style={styles.infoText}>Delegation lets someone approve requests on your behalf when you're away.</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={delegates} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="git-branch-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No delegations set up</Text>
              <Text style={styles.emptySubText}>Tap + to delegate your approvals</Text>
            </View>
          } />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={COLORS.secondary} /></TouchableOpacity>
            <Text style={styles.modalTitle}>New Delegation</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            <View>
              <Text style={styles.fieldLabel}>Employee ID to Delegate *</Text>
              <TextInput style={styles.input} value={form.delegate_id} onChangeText={v => setForm(f => ({ ...f, delegate_id: v }))}
                placeholder="Enter employee ID" placeholderTextColor={COLORS.gray300} keyboardType="numeric" />
            </View>
            <DatePickerField label="From Date *" value={form.from_date} onChange={v => setForm(f => ({ ...f, from_date: v }))} />
            <DatePickerField label="To Date *" value={form.to_date} onChange={v => setForm(f => ({ ...f, to_date: v }))} />
            <View>
              <Text style={styles.fieldLabel}>Reason</Text>
              <TextInput style={styles.textArea} value={form.reason} onChangeText={v => setForm(f => ({ ...f, reason: v }))}
                placeholder="e.g. Annual leave, travel..." multiline numberOfLines={3} placeholderTextColor={COLORS.gray300} />
            </View>
            <TouchableOpacity onPress={submit} disabled={submitting} style={styles.submitBtn}>
              {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Create Delegation</Text>}
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
  infoBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', margin: 16, padding: 12, backgroundColor: '#e0f2fe', borderRadius: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#075985', lineHeight: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  cardSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  cardReason: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.gray400 },
  emptySubText: { fontSize: 13, color: COLORS.gray300 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray500, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary },
  textArea: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary, minHeight: 90, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
