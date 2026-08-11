import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api/auth.api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS, SHADOW } from '../../constants/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email address'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconBox}>
            <Ionicons name={sent ? 'checkmark-circle-outline' : 'lock-open-outline'} size={40} color={sent ? COLORS.success : COLORS.primary} />
          </View>
          <Text style={styles.title}>{sent ? 'Email Sent!' : 'Forgot Password?'}</Text>
          <Text style={styles.subtitle}>
            {sent
              ? `We've sent a password reset link to ${email}. Please check your inbox.`
              : 'Enter your registered email address and we\'ll send you a link to reset your password.'}
          </Text>

          {!sent && (
            <>
              <Input
                label="Email Address"
                placeholder="you@company.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.gray400} />}
              />
              <Button title="Send Reset Link" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
            </>
          )}

          {sent && (
            <Button title="Back to Sign In" onPress={() => navigation.goBack()} variant="outline" fullWidth size="lg" />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', margin: 16, ...SHADOW.small },
  content: { flex: 1, padding: 24, paddingTop: 8 },
  iconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 28 },
});
