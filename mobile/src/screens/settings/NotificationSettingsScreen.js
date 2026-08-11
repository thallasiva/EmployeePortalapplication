import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const NOTIFICATION_GROUPS = [
  { title: 'Leave & Attendance', icon: 'calendar-outline', color: COLORS.primary, items: [
    { key: 'leave_request',     label: 'Leave Requests',       desc: 'When team members apply for leave' },
    { key: 'leave_approved',    label: 'Leave Approved/Rejected', desc: 'Status updates on your leaves' },
    { key: 'attendance_alert',  label: 'Attendance Alerts',    desc: 'Late check-in and missing punch' },
    { key: 'regularization',    label: 'Regularization',       desc: 'Regularization request updates' },
  ]},
  { title: 'Payroll & Finance', icon: 'cash-outline', color: '#059669', items: [
    { key: 'payslip_generated', label: 'Payslip Generated',    desc: 'When monthly payslip is ready' },
    { key: 'reimbursement',     label: 'Reimbursements',       desc: 'Status on reimbursement claims' },
    { key: 'salary_revision',   label: 'Salary Revision',      desc: 'When your salary is revised' },
  ]},
  { title: 'Tasks & Projects', icon: 'checkbox-outline', color: '#7c3aed', items: [
    { key: 'task_assigned',     label: 'Task Assigned',        desc: 'When a task is assigned to you' },
    { key: 'task_due',          label: 'Task Due Reminders',   desc: 'Reminders before task due date' },
    { key: 'timesheet_reminder',label: 'Timesheet Reminder',   desc: 'Daily timesheet fill reminder' },
  ]},
  { title: 'HR & Compliance', icon: 'shield-outline', color: '#0891b2', items: [
    { key: 'appraisal',         label: 'Appraisal Updates',    desc: 'Performance review notifications' },
    { key: 'resignation',       label: 'Resignation Status',   desc: 'Updates on resignation process' },
    { key: 'helpdesk_update',   label: 'Helpdesk Updates',     desc: 'Support ticket responses' },
    { key: 'announcement',      label: 'Announcements',        desc: 'Company-wide announcements' },
  ]},
  { title: 'Delivery Channels', icon: 'notifications-outline', color: '#db2777', items: [
    { key: 'push_enabled',      label: 'Push Notifications',   desc: 'Receive push alerts on this device' },
    { key: 'email_enabled',     label: 'Email Notifications',  desc: 'Receive updates via email' },
  ]},
];

export default function NotificationSettingsScreen({ navigation }) {
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await client.get('/notifications/preferences');
        setPrefs(r.data?.data ?? r.data ?? {});
      } catch {
        // Init defaults
        const defaults = {};
        NOTIFICATION_GROUPS.forEach(g => g.items.forEach(i => { defaults[i.key] = true; }));
        setPrefs(defaults);
      }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    setSaving(true);
    try {
      await client.put('/notifications/preferences', prefs);
      Alert.alert('Saved', 'Notification preferences updated');
    } catch { Alert.alert('Error', 'Could not save preferences'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
        <TouchableOpacity onPress={save} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color={COLORS.primary} />
            : <Text style={styles.saveBtnTxt}>Save</Text>}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.desc}>Choose which notifications you'd like to receive. Changes save immediately.</Text>
        {NOTIFICATION_GROUPS.map(group => (
          <View key={group.title} style={styles.section}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: group.color + '15' }]}>
                <Ionicons name={group.icon} size={16} color={group.color} />
              </View>
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>
            <View style={styles.card}>
              {group.items.map((item, idx) => (
                <View key={item.key} style={[styles.row, idx < group.items.length - 1 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={prefs[item.key] !== false}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: COLORS.gray200, true: COLORS.primary + '60' }}
                    thumbColor={prefs[item.key] !== false ? COLORS.primary : COLORS.gray300}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{flexDirection:'row',alignItems:'center',padding:16,gap:10,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  back:{padding:4},
  title:{flex:1,fontSize:18,fontWeight:'800',color:COLORS.secondary},
  saveBtn:{paddingHorizontal:14,paddingVertical:7,backgroundColor:COLORS.primary,borderRadius:8},
  saveBtnTxt:{fontSize:13,fontWeight:'800',color:COLORS.white},
  body:{padding:16,gap:16,paddingBottom:40},
  desc:{fontSize:13,color:COLORS.gray500,lineHeight:18},
  section:{gap:8},
  groupHeader:{flexDirection:'row',alignItems:'center',gap:8},
  groupIcon:{width:30,height:30,borderRadius:8,justifyContent:'center',alignItems:'center'},
  groupTitle:{fontSize:13,fontWeight:'800',color:COLORS.secondary},
  card:{backgroundColor:COLORS.white,borderRadius:12,overflow:'hidden'},
  row:{flexDirection:'row',alignItems:'center',padding:14,gap:12},
  rowBorder:{borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  rowLabel:{fontSize:14,fontWeight:'600',color:COLORS.secondary},
  rowDesc:{fontSize:12,color:COLORS.gray500,marginTop:2},
});
