import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { itDeclarationApi } from '../../api/itDeclaration.api';
import { formatCurrency } from '../../utils/formatters';

const SECTIONS = [
  { id: 'sec80c', label: 'Section 80C', limit: 150000, fields: ['PPF', 'ELSS', 'LIC Premium', 'NSC', 'Home Loan Principal', 'Tuition Fees', 'ULIP', 'FD (5yr)'] },
  { id: 'sec80d', label: 'Section 80D', limit: 25000, fields: ['Health Insurance Premium', 'Preventive Health Checkup'] },
  { id: 'hra', label: 'HRA Exemption', limit: null, fields: ['Monthly Rent', 'Landlord PAN'] },
  { id: 'nps', label: 'NPS (80CCD)', limit: 50000, fields: ['NPS Contribution'] },
  { id: 'other', label: 'Other Deductions', limit: null, fields: ['Education Loan Interest (80E)', 'Home Loan Interest (24b)', 'Savings Interest (80TTA)'] },
];

export default function ITDeclarationScreen({ navigation }) {
  const [declarations, setDeclarations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('draft');
  const [activeSection, setActiveSection] = useState('sec80c');

  const fetchDeclaration = async () => {
    setLoading(true);
    try {
      const res = await itDeclarationApi.my();
      setDeclarations(res.data?.declarations || res.data?.data || {});
      setStatus(res.data?.status || 'draft');
    } catch { setDeclarations({}); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDeclaration(); }, []);

  const updateField = (sectionId, field, value) => {
    setDeclarations(prev => ({ ...prev, [sectionId]: { ...(prev[sectionId] || {}), [field]: value } }));
  };

  const saveDeclaration = async (submit = false) => {
    setSaving(true);
    try {
      await itDeclarationApi.save({ declarations, status: submit ? 'submitted' : 'draft' });
      Alert.alert('Success', submit ? 'Declaration submitted!' : 'Draft saved.');
      if (submit) setStatus('submitted');
    } catch { Alert.alert('Error', 'Save failed.'); } finally { setSaving(false); }
  };

  const getTotalForSection = (sectionId) => {
    const vals = declarations[sectionId] || {};
    return Object.values(vals).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  };

  const getGrandTotal = () => SECTIONS.reduce((s, sec) => s + getTotalForSection(sec.id), 0);

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>IT Declaration</Text>
        <View style={[styles.statusBadge, { backgroundColor: status === 'submitted' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
          <Text style={[styles.statusText, { color: status === 'submitted' ? COLORS.success : COLORS.warning }]}>{status}</Text>
        </View>
      </View>

      {/* Summary Banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{formatCurrency(getGrandTotal())}</Text>
          <Text style={styles.summaryLabel}>Total Declared</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{formatCurrency(Math.min(getGrandTotal(), 150000))}</Text>
          <Text style={styles.summaryLabel}>Est. Tax Saving</Text>
        </View>
      </View>

      {/* Section Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionScroll} contentContainerStyle={styles.sectionContainer}>
        {SECTIONS.map(s => {
          const total = getTotalForSection(s.id);
          return (
            <TouchableOpacity key={s.id} onPress={() => setActiveSection(s.id)} style={[styles.sectionChip, activeSection === s.id && styles.sectionChipActive]}>
              <Text style={[styles.sectionChipText, activeSection === s.id && styles.sectionChipTextActive]}>{s.label}</Text>
              {total > 0 && <View style={styles.sectionDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.formContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDeclaration} colors={[COLORS.primary]} />}
      >
        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} /> : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{currentSection?.label}</Text>
              {currentSection?.limit && (
                <Text style={styles.cardLimit}>Limit: {formatCurrency(currentSection.limit)}</Text>
              )}
            </View>
            {currentSection?.limit && (
              <View style={styles.progressWrap}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min((getTotalForSection(activeSection) / currentSection.limit) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{formatCurrency(getTotalForSection(activeSection))} / {formatCurrency(currentSection.limit)}</Text>
              </View>
            )}
            {currentSection?.fields.map(field => (
              <View key={field} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{field}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={String(declarations[activeSection]?.[field] || '')}
                  onChangeText={v => updateField(activeSection, field, v)}
                  placeholder="0"
                  placeholderTextColor={COLORS.gray300}
                  keyboardType="numeric"
                  editable={status !== 'submitted'}
                />
              </View>
            ))}
          </View>
        )}

        {status !== 'submitted' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.draftBtn} onPress={() => saveDeclaration(false)} disabled={saving}>
              <Text style={styles.draftText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={() => Alert.alert('Submit', 'Submit final declaration?', [{ text: 'Cancel' }, { text: 'Submit', onPress: () => saveDeclaration(true) }])} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.submitText}>Submit</Text>}
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
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary, flex: 1, marginLeft: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  summaryBanner: { flexDirection: 'row', backgroundColor: COLORS.secondary, padding: 20 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionScroll: { backgroundColor: COLORS.white, maxHeight: 52, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  sectionContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  sectionChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionChipActive: { backgroundColor: COLORS.primary },
  sectionChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  sectionChipTextActive: { color: COLORS.white },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  formContent: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  cardLimit: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  progressWrap: { marginBottom: 16 },
  progressBar: { height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: COLORS.gray500, textAlign: 'right' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.gray100, paddingVertical: 10 },
  fieldLabel: { flex: 1, fontSize: 13, color: COLORS.gray600 },
  fieldInput: { width: 120, textAlign: 'right', fontSize: 14, fontWeight: '600', color: COLORS.secondary, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 8, padding: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  draftBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.gray100, alignItems: 'center' },
  draftText: { fontSize: 14, fontWeight: '700', color: COLORS.gray600 },
  submitBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
