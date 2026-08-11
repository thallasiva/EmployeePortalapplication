import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { leaveApi } from '../../api/leave.api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS, SHADOW } from '../../constants/colors';
import { formatDate } from '../../utils/formatters';
import DatePickerField from '../../components/DatePickerField';

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave', 'Paternity Leave', 'Emergency Leave'];

export default function ApplyLeaveScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const days = fromDate && toDate ? Math.max(1, Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1) : 0;

  const handleApply = async () => {
    if (!leaveType || !fromDate || !toDate || !reason.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      Alert.alert('Invalid Dates', 'From date cannot be after to date');
      return;
    }
    setLoading(true);
    try {
      await leaveApi.apply({
        leave_type_name: leaveType,
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim(),
        no_of_days: days,
      });
      Alert.alert('Success', 'Leave application submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to apply for leave');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply for Leave</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Leave Type */}
          <Text style={styles.sectionLabel}>Leave Type *</Text>
          <View style={styles.typeGrid}>
            {LEAVE_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, leaveType === type && styles.typeChipActive]}
                onPress={() => setLeaveType(type)}
              >
                <Text style={[styles.typeChipText, leaveType === type && styles.typeChipTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date Range */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <DatePickerField label="From Date *" value={fromDate} onChange={setFromDate} />
              } />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <DatePickerField label="To Date *" value={toDate} onChange={setToDate} />
              } />
            </View>
          </View>

          {/* Duration Badge */}
          {days > 0 && (
            <View style={[styles.durationCard, SHADOW.small]}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.durationText}>{days} working day{days > 1 ? 's' : ''}</Text>
            </View>
          )}

          {/* Reason */}
          <Input label="Reason *" placeholder="Please describe the reason for your leave…"
            value={reason} onChangeText={setReason} multiline numberOfLines={4} />

          <Button title={loading ? 'Submitting…' : 'Submit Application'} onPress={handleApply} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.gray50, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.gray200, backgroundColor: COLORS.white },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
  typeChipTextActive: { color: COLORS.white },
  dateRow: { flexDirection: 'row' },
  durationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primaryBorder },
  durationText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
