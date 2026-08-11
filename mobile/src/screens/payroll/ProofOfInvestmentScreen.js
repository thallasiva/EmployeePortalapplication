import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';

const POI_SECTIONS = [
  { key: '80C', label: '80C Investments', max: 150000, icon: 'shield-checkmark-outline', color: '#059669', items: ['LIC Premium', 'PPF', 'ELSS Mutual Fund', 'NSC', 'Tax Saver FD', 'Home Loan Principal', 'Tuition Fees'] },
  { key: '80D', label: '80D Medical Insurance', max: 25000, icon: 'heart-outline', color: '#db2777', items: ['Self & Family Medical Insurance', 'Parents Medical Insurance', 'Preventive Health Checkup'] },
  { key: 'HRA', label: 'HRA Exemption', max: null, icon: 'home-outline', color: '#0891b2', items: ['Rent Paid (monthly)', 'Landlord PAN'] },
  { key: '80E', label: '80E Education Loan', max: null, icon: 'school-outline', color: '#7c3aed', items: ['Education Loan Interest'] },
  { key: '80G', label: '80G Donations', max: null, icon: 'gift-outline', color: '#f59e0b', items: ['PM Relief Fund', 'Approved Charitable Institutions'] },
];

export default function ProofOfInvestmentScreen({ navigation }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(POI_SECTIONS[0]);
  const [form, setForm] = useState({ category: '80C', investment_type: '', amount: '', remarks: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    client.get('/payroll/poi/my').then(unwrap)
      .then(res => setSubmissions(Array.isArray(res) ? res : (res?.rows || [])))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.investment_type || !form.amount) { Alert.alert('Required', 'Please fill investment type and amount'); return; }
    setSubmitting(true);
    try {
      await client.post('/payroll/poi', { ...form, amount: parseFloat(form.amount) });
      Alert.alert('Submitted', 'Proof of investment submitted for review');
      setShowModal(false);
      setForm({ category: '80C', investment_type: '', amount: '', remarks: '' });
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardCategory}>{item.category || '80C'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardType}>{item.investment_type}</Text>
        <Text style={styles.cardAmount}>{fmt(item.amount)}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: item.status === 'approved' ? '#dcfce7' : item.status === 'rejected' ? '#fee2e2' : '#fef3c7' }]}>
        <Text style={[styles.statusText, { color: item.status === 'approved' ? '#059669' : item.status === 'rejected' ? '#dc2626' : '#d97706' }]}>
          {item.status || 'Pending'}
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
        <Text style={styles.headerTitle}>Proof of Investment</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionsRow}>
        {POI_SECTIONS.map(s => (
          <TouchableOpacity key={s.key} onPress={() => { setSelected(s); setForm(f => ({ ...f, category: s.key })); setShowModal(true); }}
            style={[styles.sectionBtn, { backgroundColor: s.color + '15' }]}>
            <Ionicons name={s.icon} size={20} color={s.color} />
            <Text style={[styles.sectionBtnText, { color: s.color }]}>{s.key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={submissions} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-attach-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No proof of investment submitted</Text>
              <Text style={styles.emptySubText}>Tap a section above to add</Text>
            </View>
          } />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={COLORS.secondary} /></TouchableOpacity>
            <Text style={styles.modalTitle}>Add {selected.key} Investment</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            {selected.max && <View style={styles.maxBox}><Text style={styles.maxText}>Max deduction: {fmt(selected.max)}</Text></View>}
            <View>
              <Text style={styles.fieldLabel}>Investment Type *</Text>
              <View style={{ gap: 6 }}>
                {selected.items.map(it => (
                  <TouchableOpacity key={it} onPress={() => setForm(f => ({ ...f, investment_type: it }))}
                    style={[styles.typeChip, form.investment_type === it && styles.typeChipActive]}>
                    <Text style={[styles.typeChipText, form.investment_type === it && styles.typeChipTextActive]}>{it}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.fieldLabel}>Amount (₹) *</Text>
              <TextInput style={styles.input} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))}
                keyboardType="numeric" placeholder="Enter amount" placeholderTextColor={COLORS.gray300} />
            </View>
            <View>
              <Text style={styles.fieldLabel}>Remarks</Text>
              <TextInput style={styles.input} value={form.remarks} onChangeText={v => setForm(f => ({ ...f, remarks: v }))}
                placeholder="Optional remarks" placeholderTextColor={COLORS.gray300} />
            </View>
            <TouchableOpacity onPress={submit} disabled={submitting} style={styles.submitBtn}>
              {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Submit Proof</Text>}
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
  sectionsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  sectionBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 10 },
  sectionBtnText: { fontSize: 10, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 8, paddingTop: 60 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardLeft: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  cardCategory: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  cardType: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  cardAmount: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.gray400 },
  emptySubText: { fontSize: 13, color: COLORS.gray300 },
  maxBox: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 10 },
  maxText: { fontSize: 13, color: '#92400e', fontWeight: '600' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray500, marginBottom: 6 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.gray200 },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  typeChipTextActive: { color: COLORS.white },
  input: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
