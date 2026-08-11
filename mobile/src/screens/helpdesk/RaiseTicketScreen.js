import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const CATEGORIES = ['IT Support', 'HR', 'Payroll', 'Admin', 'Facilities', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const ChipGroup = ({ options, value, onChange, color }) => (
  <View style={styles.chips}>
    {options.map(o => (
      <TouchableOpacity key={o} onPress={() => onChange(o)}
        style={[styles.chip, value === o && { backgroundColor: (color || COLORS.primary) + '20', borderColor: color || COLORS.primary }]}>
        <Text style={[styles.chipTxt, value === o && { color: color || COLORS.primary, fontWeight: '700' }]}>{o}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function RaiseTicketScreen({ navigation }) {
  const [form, setForm] = useState({ subject: '', category: '', priority: 'medium', description: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.subject.trim() || !form.category || !form.description.trim()) {
      Alert.alert('Required', 'Please fill subject, category, and description'); return;
    }
    setLoading(true);
    try {
      await client.post('/helpdesk/tickets', form);
      Alert.alert('Ticket Raised', 'Your support ticket has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch {
      Alert.alert('Error', 'Could not raise ticket. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="close" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Raise Support Ticket</Text>
        <TouchableOpacity onPress={submit} disabled={loading} style={styles.submitHdr}>
          {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.submitHdrTxt}>Submit</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.field}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput style={styles.textInput} value={form.subject} onChangeText={v => set('subject', v)}
              placeholder="Brief description of your issue" placeholderTextColor={COLORS.gray400} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <ChipGroup options={CATEGORIES} value={form.category} onChange={v => set('category', v)} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Priority</Text>
            <ChipGroup
              options={PRIORITIES}
              value={form.priority}
              onChange={v => set('priority', v)}
              color={form.priority === 'critical' ? '#7c3aed' : form.priority === 'high' ? COLORS.danger : form.priority === 'low' ? COLORS.success : '#f59e0b'}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={form.description}
              onChangeText={v => set('description', v)}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={COLORS.gray400}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: COLORS.secondary },
  submitHdr: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: COLORS.primary, borderRadius: 8 },
  submitHdrTxt: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  body: { padding: 16, gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  textInput: { backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.gray100, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: COLORS.secondary },
  textArea: { height: 120 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray100 },
  chipTxt: { fontSize: 13, color: COLORS.gray500 },
});
