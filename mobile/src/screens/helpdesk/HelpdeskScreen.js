import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, Modal, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { helpdeskApi } from '../../api/helpdesk.api';
import { timeAgo } from '../../utils/formatters';

const PRIORITY_COLORS = {
  Low: COLORS.success, Medium: COLORS.warning, High: COLORS.danger, Urgent: '#7c3aed',
};
const STATUS_COLORS = {
  Open: COLORS.info, 'In Progress': COLORS.warning, Resolved: COLORS.success,
  Closed: COLORS.gray400, Forwarded: '#8b5cf6', Reopened: COLORS.warning,
};
const CATEGORIES = ['IT', 'HR', 'Payroll', 'Admin', 'Facilities', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export default function HelpdeskScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'Medium', category: 'IT' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await helpdeskApi.myTickets({ status: filter });
      const rows = Array.isArray(res) ? res : (res?.rows || res?.tickets || []);
      setTickets(rows);
    } catch (e) {
      console.log('helpdesk fetch error', e?.message);
      setTickets([]);
    }
  }, [filter]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchTickets();
    setLoading(false);
  }, [fetchTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  useEffect(() => { load(); }, [load]);

  const submitTicket = async () => {
    if (!form.subject.trim()) { Alert.alert('Required', 'Please enter a subject.'); return; }
    setSubmitting(true);
    try {
      await helpdeskApi.create(form);
      Alert.alert('Success', 'Ticket raised successfully!');
      setShowForm(false);
      setForm({ subject: '', description: '', priority: 'Medium', category: 'IT' });
      load();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTicket = ({ item }) => {
    const status = item.status || 'Open';
    const priority = item.priority || 'Low';
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('TicketDetail', { ticketId: item.ticket_id || item.helpdesk_ticket_id || item.id })}>
        <View style={styles.cardTop}>
          <View style={[styles.catBadge, { backgroundColor: COLORS.primary + '15' }]}>
            <Text style={[styles.catText, { color: COLORS.primary }]}>{item.category || 'General'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[status] || COLORS.gray400) + '25' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[status] || COLORS.gray400 }]}>{status}</Text>
          </View>
        </View>
        <Text style={styles.ticketSubject} numberOfLines={2}>{item.subject}</Text>
        {!!item.description && (
          <Text style={styles.ticketDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.cardFooter}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[priority] || COLORS.gray400 }]} />
          <Text style={styles.priorityText}>{priority}</Text>
          <Text style={styles.ticketId}>#{item.ticket_id || item.id || item.helpdesk_ticket_id}</Text>
          <Text style={styles.timeAgo}>{timeAgo(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Helpdesk</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RaiseTicket', { onCreated: onRefresh })} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, filter === f.key && styles.chipActive]}>
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ticket list */}
      <FlatList
        data={tickets}
        keyExtractor={(item, i) => String(item.ticket_id || item.helpdesk_ticket_id || item.id || i)}
        renderItem={renderTicket}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="headset-outline" size={56} color={COLORS.gray300} />
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptyDesc}>Tap + to raise a new support ticket</Text>
            </View>
          )
        }
      />
      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('RaiseTicket', { onCreated: onRefresh })}>
        <Ionicons name="add" size={26} color={COLORS.white} />
      </TouchableOpacity>

      {/* Create Ticket Modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise a Ticket</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={22} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category */}
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} onPress={() => setForm(f => ({ ...f, category: c }))}
                      style={[styles.optChip, form.category === c && styles.optChipActive]}>
                      <Text style={[styles.optChipText, form.category === c && styles.optChipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Priority */}
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map(p => (
                  <TouchableOpacity key={p} onPress={() => setForm(f => ({ ...f, priority: p }))}
                    style={[styles.priorityChip, form.priority === p && {
                      backgroundColor: (PRIORITY_COLORS[p] || COLORS.primary) + '20',
                      borderColor: PRIORITY_COLORS[p] || COLORS.primary,
                    }]}>
                    <Text style={[styles.priorityChipText, form.priority === p && { color: PRIORITY_COLORS[p] || COLORS.primary }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject */}
              <Text style={styles.inputLabel}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={form.subject}
                onChangeText={t => setForm(f => ({ ...f, subject: t }))}
                placeholder="Brief description of the issue"
                placeholderTextColor={COLORS.gray300}
                maxLength={150}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Details</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.description}
                onChangeText={t => setForm(f => ({ ...f, description: t }))}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={COLORS.gray300}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.submitBtn} onPress={submitTicket} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.submitText}>Submit Ticket</Text>}
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
  filterScroll: { backgroundColor: COLORS.white, maxHeight: 52 },
  filterContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  chipTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  catText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  ticketSubject: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, marginBottom: 4 },
  ticketDesc: { fontSize: 13, color: COLORS.gray500, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityText: { fontSize: 12, color: COLORS.gray500, fontWeight: '600', flex: 1 },
  ticketId: { fontSize: 12, color: COLORS.gray400 },
  timeAgo: { fontSize: 12, color: COLORS.gray400 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray500 },
  emptyDesc: { fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.secondary, marginBottom: 14, backgroundColor: COLORS.gray50 || '#f9fafb' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  optChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.gray100, borderWidth: 1.5, borderColor: 'transparent' },
  optChipActive: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary },
  optChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  optChipTextActive: { color: COLORS.primary },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  priorityChip: { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: COLORS.gray100, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center' },
  priorityChipText: { fontSize: 12, fontWeight: '700', color: COLORS.gray500 },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  submitText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});
