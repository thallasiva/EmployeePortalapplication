import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const PRIORITY_COLORS = { low:'#10b981', medium:'#f59e0b', high:'#ef4444' };
const STATUS_COLORS  = { pending:'#f59e0b', 'in-progress':'#3b82f6', completed:'#10b981', cancelled:'#6b7280' };

export default function TaskDetailScreen({ navigation, route }) {
  const { taskId } = route.params || {};
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await client.get(`/tasks/${taskId}`);
        const d = r.data?.data ?? r.data;
        setTask(d);
        setNote(d?.notes || d?.description || '');
      } catch { setTask(null); }
      finally { setLoading(false); }
    };
    if (taskId) load();
  }, [taskId]);

  const updateStatus = (status) => {
    Alert.alert('Update Status', `Mark as "${status}"?`, [
      { text:'Cancel' },
      { text:'Update', onPress: async () => {
        try {
          await client.put(`/tasks/${taskId}`, { status });
          setTask(p => ({ ...p, status }));
        } catch { Alert.alert('Error','Could not update status'); }
      }},
    ]);
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      await client.put(`/tasks/${taskId}`, { notes: note });
      Alert.alert('Saved','Notes updated successfully');
    } catch { Alert.alert('Error','Could not save notes'); }
    finally { setSaving(false); }
  };

  const logHours = () => {
    Alert.prompt('Log Hours','How many hours did you spend on this task?',
      async (hours) => {
        if (!hours || isNaN(Number(hours))) return;
        try {
          await client.post(`/tasks/${taskId}/log`, { hours: Number(hours) });
          Alert.alert('Logged',`${hours} hours logged successfully`);
        } catch { Alert.alert('Error','Could not log hours'); }
      }, 'plain-text', '', 'numeric');
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!task) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Task not found</Text></View>;

  const pColor = PRIORITY_COLORS[task.priority] || COLORS.gray400;
  const sColor = STATUS_COLORS[task.status] || COLORS.gray400;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{task.title || 'Task Detail'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.heroCard}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: sColor + '20' }]}>
              <Text style={[styles.badgeTxt, { color: sColor }]}>{task.status || 'pending'}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: pColor + '20' }]}>
              <Ionicons name="flag-outline" size={12} color={pColor} />
              <Text style={[styles.badgeTxt, { color: pColor }]}>{task.priority || 'medium'}</Text>
            </View>
          </View>
          <View style={styles.metaGrid}>
            <MetaItem icon="calendar-outline" label="Due Date" value={task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'} />
            <MetaItem icon="time-outline" label="Estimated" value={task.estimated_hours ? `${task.estimated_hours}h` : '—'} />
            <MetaItem icon="person-outline" label="Assigned By" value={task.assigned_by || task.manager || '—'} />
            <MetaItem icon="folder-outline" label="Project" value={task.project || task.project_name || '—'} />
          </View>
        </View>

        {task.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.card}><Text style={styles.desc}>{task.description}</Text></View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusBtns}>
            {['in-progress','completed','cancelled'].map(s => (
              <TouchableOpacity key={s} onPress={() => updateStatus(s)}
                style={[styles.statusBtn, task.status === s && { backgroundColor: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] }]}>
                <Text style={[styles.statusBtnTxt, task.status === s && { color: COLORS.white }]}>
                  {s.replace('-',' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TouchableOpacity onPress={saveNote} disabled={saving} style={styles.saveBtn}>
              {saving ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={styles.saveBtnTxt}>Save</Text>}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add notes about this task..."
            placeholderTextColor={COLORS.gray400}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.logBtn} onPress={logHours}>
          <Ionicons name="time-outline" size={18} color={COLORS.primary} />
          <Text style={styles.logBtnTxt}>Log Hours</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const MetaItem = ({ icon, label, value }) => (
  <View style={styles.metaItem}>
    <Ionicons name={icon} size={14} color={COLORS.gray400} />
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{flexDirection:'row',alignItems:'center',padding:16,gap:10,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  back:{padding:4},
  title:{flex:1,fontSize:17,fontWeight:'800',color:COLORS.secondary},
  body:{padding:16,gap:16,paddingBottom:40},
  heroCard:{backgroundColor:COLORS.white,borderRadius:14,padding:16,gap:12},
  taskTitle:{fontSize:17,fontWeight:'800',color:COLORS.secondary},
  badges:{flexDirection:'row',gap:8},
  badge:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:4,borderRadius:20},
  badgeTxt:{fontSize:11,fontWeight:'700',textTransform:'capitalize'},
  metaGrid:{flexDirection:'row',flexWrap:'wrap',gap:14},
  metaItem:{flexDirection:'row',alignItems:'flex-start',gap:6,width:'45%'},
  metaLabel:{fontSize:10,color:COLORS.gray400,fontWeight:'600'},
  metaValue:{fontSize:12,fontWeight:'700',color:COLORS.secondary},
  section:{gap:8},
  sectionTitle:{fontSize:12,fontWeight:'800',color:COLORS.gray400,textTransform:'uppercase',letterSpacing:1},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  card:{backgroundColor:COLORS.white,borderRadius:12,padding:14},
  desc:{fontSize:14,color:COLORS.gray600||COLORS.gray500,lineHeight:22},
  statusBtns:{flexDirection:'row',gap:10},
  statusBtn:{flex:1,paddingVertical:10,borderRadius:10,borderWidth:1.5,borderColor:COLORS.gray100,alignItems:'center',backgroundColor:COLORS.white},
  statusBtnTxt:{fontSize:12,fontWeight:'700',color:COLORS.gray500,textTransform:'capitalize'},
  saveBtn:{paddingHorizontal:14,paddingVertical:6,backgroundColor:COLORS.primary+'15',borderRadius:8},
  saveBtnTxt:{fontSize:12,fontWeight:'700',color:COLORS.primary},
  noteInput:{backgroundColor:COLORS.white,borderRadius:12,borderWidth:1.5,borderColor:COLORS.gray100,padding:12,fontSize:14,color:COLORS.secondary,minHeight:100},
  logBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:12,borderWidth:1.5,borderColor:COLORS.primary+'30',backgroundColor:COLORS.primary+'10'},
  logBtnTxt:{fontSize:14,fontWeight:'700',color:COLORS.primary},
});
