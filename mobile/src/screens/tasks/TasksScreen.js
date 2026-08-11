import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { tasksApi } from '../../api/tasks.api';
import { timeAgo } from '../../utils/formatters';

const FILTERS = ['all', 'pending', 'in_progress', 'completed', 'overdue'];
const PRIORITY_COLORS = { low: COLORS.success, medium: COLORS.warning, high: COLORS.danger };

export default function TasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tasksApi.myTasks({ status: filter === 'all' ? undefined : filter });
      setTasks(Array.isArray(res) ? res : (res?.tasks || res?.items || []));
    } catch { setTasks([]); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const toggleComplete = async (task) => {
    try {
      await tasksApi.update(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' });
      fetchTasks();
    } catch {}
  };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date() ;

  const renderTask = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('TaskDetail', { taskId: item.id || item.task_id })}>
      <TouchableOpacity style={styles.checkbox} onPress={() => toggleComplete(item)}>
        <Ionicons name={item.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={item.status === 'completed' ? COLORS.success : COLORS.gray300} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.taskTitle, item.status === 'completed' && styles.taskDone]} numberOfLines={2}>{item.title || item.task_name}</Text>
        {item.description ? <Text style={styles.taskDesc} numberOfLines={1}>{item.description}</Text> : null}
        <View style={styles.taskMeta}>
          {item.due_date && (
            <View style={[styles.dueBadge, isOverdue(item.due_date) && item.status !== 'completed' && { backgroundColor: COLORS.danger + '15' }]}>
              <Ionicons name="time-outline" size={11} color={isOverdue(item.due_date) && item.status !== 'completed' ? COLORS.danger : COLORS.gray400} />
              <Text style={[styles.dueText, isOverdue(item.due_date) && item.status !== 'completed' && { color: COLORS.danger }]}>{item.due_date}</Text>
            </View>
          )}
          {item.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: (PRIORITY_COLORS[item.priority] || COLORS.gray400) + '15' }]}>
              <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] || COLORS.gray400 }]}>{item.priority}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const stats = { total: tasks.length, pending: tasks.filter(t => t.status === 'pending').length, done: tasks.filter(t => t.status === 'completed').length, overdue: tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.statsRow}>
        {[{ label: 'Total', val: stats.total, color: COLORS.secondary }, { label: 'Pending', val: stats.pending, color: COLORS.warning }, { label: 'Done', val: stats.done, color: COLORS.success }, { label: 'Overdue', val: stats.overdue, color: COLORS.danger }].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList data={tasks} keyExtractor={item => String(item.id)} renderItem={renderTask}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTasks} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="checkbox-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No tasks found</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  filterScroll: { backgroundColor: COLORS.white, maxHeight: 52 },
  filterContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  chipTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  checkbox: { paddingTop: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: COLORS.secondary, marginBottom: 4 },
  taskDone: { textDecorationLine: 'line-through', color: COLORS.gray400 },
  taskDesc: { fontSize: 12, color: COLORS.gray500, marginBottom: 6 },
  taskMeta: { flexDirection: 'row', gap: 8 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.gray100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dueText: { fontSize: 11, color: COLORS.gray400, fontWeight: '600' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
