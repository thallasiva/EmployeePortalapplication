import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const Field = ({ label, value, onChange, secure, show, onToggle }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
        placeholder="Enter password"
        placeholderTextColor={COLORS.gray400}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} style={styles.eye}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray400} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const strength = (p) => {
    if (!p) return { label: '', color: COLORS.gray200, width: '0%' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak', color: COLORS.danger, width: '25%' };
    if (score === 2) return { label: 'Fair', color: '#f59e0b', width: '50%' };
    if (score === 3) return { label: 'Good', color: '#10b981', width: '75%' };
    return { label: 'Strong', color: COLORS.success, width: '100%' };
  };

  const s = strength(newPass);

  const submit = async () => {
    if (!current || !newPass || !confirm) {
      Alert.alert('Error', 'All fields are required'); return;
    }
    if (newPass !== confirm) {
      Alert.alert('Error', 'New passwords do not match'); return;
    }
    if (newPass.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters'); return;
    }
    setLoading(true);
    try {
      await client.put('/auth/change-password', { currentPassword: current, newPassword: newPass });
      Alert.alert('Success', 'Password changed successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.subtitle}>Choose a strong, unique password to keep your account secure.</Text>

        <Field label="Current Password" value={current} onChange={setCurrent}
          show={show.current} onToggle={() => setShow(p => ({ ...p, current: !p.current }))} />
        <Field label="New Password" value={newPass} onChange={setNewPass}
          show={show.new} onToggle={() => setShow(p => ({ ...p, new: !p.new }))} />

        {newPass.length > 0 && (
          <View style={styles.strengthWrap}>
            <View style={styles.strengthBar}>
              <View style={[styles.strengthFill, { width: s.width, backgroundColor: s.color }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        )}

        <Field label="Confirm New Password" value={confirm} onChange={setConfirm}
          show={show.confirm} onToggle={() => setShow(p => ({ ...p, confirm: !p.confirm }))} />

        <View style={styles.rules}>
          {[
            ['At least 8 characters', newPass.length >= 8],
            ['One uppercase letter', /[A-Z]/.test(newPass)],
            ['One number', /[0-9]/.test(newPass)],
            ['One special character', /[^A-Za-z0-9]/.test(newPass)],
          ].map(([rule, ok]) => (
            <View key={rule} style={styles.ruleRow}>
              <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={16}
                color={ok ? COLORS.success : COLORS.gray300} />
              <Text style={[styles.ruleTxt, ok && styles.ruleTxtOk]}>{rule}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitTxt}>Update Password</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  back: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  body: { padding: 20, gap: 16 },
  iconWrap: { alignItems: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignSelf: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', lineHeight: 20 },
  fieldWrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.gray100, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: COLORS.secondary },
  eye: { padding: 8 },
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthBar: { flex: 1, height: 4, backgroundColor: COLORS.gray100, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', width: 50 },
  rules: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, gap: 8 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleTxt: { fontSize: 13, color: COLORS.gray400 },
  ruleTxtOk: { color: COLORS.secondary },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  submitTxt: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});
