import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

export default function OnboardingDetailScreen({ navigation, route }) {
  const { onboardingId } = route.params || {};
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await client.get(`/onboarding/${onboardingId}`);
        const d = r.data?.data ?? r.data;
        setData(d);
        setTasks(d?.tasks || d?.checklist || []);
      } catch { setData(null); }
      finally { setLoading(false); }
    };
    if (onboardingId) load();
  }, [onboardingId]);

  const toggleTask = async (task, idx) => {
    const done = !task.completed;
    try {
      await client.put(`/onboarding/${onboardingId}/tasks/${task.id}`, { completed: done });
      setTasks(prev => prev.map((t, i) => i === idx ? { ...t, completed: done } : t));
    } catch { Alert.alert('Error', 'Could not update task'); }
  };

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const completed = tasks.filter(t => t.completed).length;
  const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Onboarding Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {data && (
          <View style={styles.heroCard}>
            <View style={styles.empRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{(data.employee_name || data.name || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.empName}>{data.employee_name || data.name || '—'}</Text>
                <Text style={styles.empRole}>{data.designation || data.position || ''}</Text>
                <Text style={styles.joinDate}>Joining: {data.joining_date ? new Date(data.joining_date).toLocaleDateString() : '—'}</Text>
              </View>
            </View>
            <View style={styles.progressWrap}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressPct}>{pct}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressSub}>{completed}/{tasks.length} tasks done</Text>
            </View>
          </View>
        )}

        {tasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Onboarding Checklist</Text>
            {tasks.map((task, i) => (
              <TouchableOpacity key={i} style={styles.taskRow} onPress={() => toggleTask(task, i)}>
                <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
                  {task.completed && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskDone]}>{task.title || task.task || task.name}</Text>
                  {task.description && <Text style={styles.taskDesc}>{task.description}</Text>}
                  {task.due_date && <Text style={styles.taskDue}>Due: {new Date(task.due_date).toLocaleDateString()}</Text>}
                </View>
                {task.category && (
                  <View style={styles.catBadge}>
                    <Text style={styles.catTxt}>{task.category}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!data && !loading && (
          <View style={styles.empty}>
            <Ionicons name="person-add-outline" size={48} color={COLORS.gray300} />
            <Text style={styles.emptyTxt}>Onboarding not found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  back: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, gap: 14 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  empName: { fontSize: 15, fontWeight: '800', color: COLORS.secondary },
  empRole: { fontSize: 12, color: COLORS.gray500 },
  joinDate: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  progressWrap: { gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  progressPct: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  progressBar: { height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressSub: { fontSize: 12, color: COLORS.gray500 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.gray200, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  taskTitle: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  taskDone: { color: COLORS.gray400, textDecorationLine: 'line-through' },
  taskDesc: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  taskDue: { fontSize: 11, color: COLORS.warning, fontWeight: '600', marginTop: 2 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: COLORS.primary + '12', borderRadius: 20 },
  catTxt: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTxt: { fontSize: 15, color: COLORS.gray400 },
});
