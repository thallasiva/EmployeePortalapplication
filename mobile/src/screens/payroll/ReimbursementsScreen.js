import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';
import DatePickerField from '../../components/DatePickerField';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';

const STATUS_COLOR = { pending: '#f59e0b', approved: '#059669', rejected: '#ef4444', paid: '#0891b2' };
const CATEGORIES = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Medical', 'Training', 'Other'];

export default function ReimbursementsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'Travel', expense_date: '', amount: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/payroll/reimbursements/my').then(unwrap)
      .then(res => setItems(Array.isArray(res) ? res : (res?.rows || [])))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.expense_date || !form.amount) { Alert.alert('Required', 'Please fill date and amount'); return; }
    setSubmitting(true);
    try {
      await client.post('/payroll/reimbursements', { ...form, amount: parseFloat(form.amount) });
      Alert.alert('Submitted', 'Reimbursement claim submitted for approval');
      setShowModal(false);
      setForm({ category: 'Travel', expense_date: '', amount: '', description: '' });
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '15' }]}>
        <Ionicons name="receipt-outline" size={22} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.category}</Text>
        <Text style={styles.cardDate}>{item.expense_date}</Text>
        <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={styles.cardAmount}>{fmt(item.amount)}</Text>
        <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] || COLORS.gray400) + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] || COLORS.gray400 }]}>
            {(item.status || 'pending').charAt(0).toUpperCase() + (item.status || 'pending').slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reimbursements</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={items} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No reimbursements yet</Text>
              <Text style={styles.emptySubText}>Tap + to submit a claim</Text>
            </View>
          } />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={COLORS.secondary} /></TouchableOpacity>
            <Text style={styles.modalTitle}>New Reimbursement</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            <View>
              <Text style={styles.fieldLabel}>Category *</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} onPress={() => setForm(f => ({ ...f, category: c }))}
                    style={[styles.chip, form.category === c && styles.chipActive]}>
                    <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <DatePickerField label="Expense Date *" value={form.expense_date} onChange={v => setForm(f => ({ ...f, expense_date: v }))} />
            <View>
              <Text style={styles.fieldLabel}>Amount (₹) *</Text>
              <TextInput style={styles.input} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))}
                keyboardType="numeric" placeholder="0.00" placeholderTextColor={COLORS.gray300} />
            </View>
            <View>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={styles.textArea} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))}
                placeholder="Brief description of expense..." multiline numberOfLines={3} placeholderTextColor={COLORS.gray300} />
            </View>
            <TouchableOpacity onPress={submit} disabled={submitting} style={styles.submitBtn}>
              {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Submit Claim</Text>}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 8, paddingTop: 60 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  cardDate: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  cardDesc: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  cardAmount: { fontSize: 15, fontWeight: '800', color: COLORS.secondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.gray400 },
  emptySubText: { fontSize: 13, color: COLORS.gray300 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray500, marginBottom: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.gray200 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  chipTextActive: { color: COLORS.white },
  input: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary },
  textArea: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary, minHeight: 90, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
