import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;

const TYPES = ['Earning', 'Deduction', 'Reimbursement', 'Statutory'];
const CALC_TYPES = ['Fixed', 'Percentage'];

export default function SalaryComponentsScreen({ navigation }) {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Earning', calc_type: 'Fixed', value: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await client.get('/salary-components', { params: { limit: 500 } }).then(unwrap).catch(() => []);
    setComponents(Array.isArray(res) ? res : res?.data || []);
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', type: 'Earning', calc_type: 'Fixed', value: '', description: '' });
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.component_name || item.name || '',
      type: item.component_type || item.type || 'Earning',
      calc_type: item.calc_type || 'Fixed',
      value: String(item.value || item.default_value || ''),
      description: item.description || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Validation', 'Component name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        component_name: form.name,
        component_type: form.type,
        calc_type: form.calc_type,
        value: Number(form.value) || 0,
        description: form.description,
      };
      if (editItem) {
        await client.put(`/salary-components/${editItem.component_id || editItem.id}`, payload);
        Alert.alert('Success', 'Component updated.');
      } else {
        await client.post('/salary-components', payload);
        Alert.alert('Success', 'Component created.');
      }
      setModalVisible(false);
      load();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Component', `Delete "${item.component_name || item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/salary-components/${item.component_id || item.id}`);
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete component');
          }
        },
      },
    ]);
  };

  const typeColor = (t) => {
    const m = { Earning: COLORS.success, Deduction: COLORS.danger, Reimbursement: COLORS.info, Statutory: '#7c3aed' };
    return m[t] || COLORS.gray400;
  };

  const filtered = filter === 'All' ? components : components.filter(c => (c.component_type || c.type) === filter);

  const renderItem = ({ item }) => {
    const t = item.component_type || item.type || 'Earning';
    const tColor = typeColor(t);
    const name = item.component_name || item.name;
    const val = item.value || item.default_value;
    const calcType = item.calc_type || 'Fixed';
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.typeIcon, { backgroundColor: tColor + '15' }]}>
            <Ionicons name={t === 'Deduction' ? 'remove-circle-outline' : t === 'Statutory' ? 'business-outline' : 'add-circle-outline'} size={18} color={tColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.componentName}>{name}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
              <View style={[styles.chip, { backgroundColor: tColor + '18' }]}>
                <Text style={[styles.chipText, { color: tColor }]}>{t}</Text>
              </View>
              <Text style={styles.compValue}>{calcType === 'Percentage' ? `${val}%` : `₹${val}`}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
              <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: COLORS.danger + '10' }]} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
        {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Salary Components</Text>
          <Text style={styles.subtitle}>Earnings, deductions & statutory</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {['All', ...TYPES].map(t => (
          <TouchableOpacity key={t} onPress={() => setFilter(t)}
            style={[styles.filterChip, filter === t && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
            <Text style={[styles.filterChipText, filter === t && { color: COLORS.white }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => String(item.component_id || item.id || i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListHeaderComponent={() => <Text style={styles.listHeader}>{filtered.length} component{filtered.length !== 1 ? 's' : ''}</Text>}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="cash-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyTitle}>No components</Text>
              <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.createBtnText}>Create First Component</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>{editItem ? 'Edit' : 'New'} Component</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginLeft: 'auto' }}>
                <Ionicons name="close" size={22} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput style={styles.fieldInput} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Basic Salary" placeholderTextColor={COLORS.gray300} />
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {TYPES.map(t => (
                  <TouchableOpacity key={t} onPress={() => setForm(f => ({ ...f, type: t }))}
                    style={[styles.typeChip, form.type === t && { backgroundColor: typeColor(t), borderColor: typeColor(t) }]}>
                    <Text style={[styles.typeChipText, form.type === t && { color: COLORS.white }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Calculation Type</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {CALC_TYPES.map(t => (
                  <TouchableOpacity key={t} onPress={() => setForm(f => ({ ...f, calc_type: t }))}
                    style={[styles.typeChip, form.calc_type === t && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
                    <Text style={[styles.typeChipText, form.calc_type === t && { color: COLORS.white }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Value ({form.calc_type === 'Percentage' ? '%' : '₹'})</Text>
              <TextInput style={styles.fieldInput} value={form.value} onChangeText={v => setForm(f => ({ ...f, value: v }))} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.gray300} />
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.fieldInput, { height: 70, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional description" placeholderTextColor={COLORS.gray300} multiline />
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.saveBtnText}>{editItem ? 'Update Component' : 'Create Component'}</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  subtitle: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  filterRow: { backgroundColor: COLORS.white, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.gray100, backgroundColor: COLORS.gray50 },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: { fontSize: 12, fontWeight: '700', color: COLORS.gray400, marginBottom: 4 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, gap: 6 },
  typeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  componentName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: '700' },
  compValue: { fontSize: 13, fontWeight: '800', color: COLORS.secondary },
  iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center' },
  desc: { fontSize: 12, color: COLORS.gray400, paddingLeft: 50 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray400 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  createBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, marginBottom: 6 },
  fieldInput: { backgroundColor: COLORS.gray50, borderWidth: 1.5, borderColor: COLORS.gray100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: COLORS.secondary, marginBottom: 14 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 },
  typeChipText: { fontSize: 12, fontWeight: '700', color: COLORS.gray500 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});
