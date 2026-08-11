import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Top Gradient Banner */}
        <LinearGradient colors={['#1a1a2e', '#2d1b69', '#f18200']} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.logoBox}>
            <View style={styles.logoCircle}>
              <Ionicons name="people" size={36} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.appName}>NAT IT HRMS</Text>
          <Text style={styles.tagline}>Human Resource Management System</Text>
          {/* Decorative circles */}
          <View style={[styles.circle, { width: 120, height: 120, top: -40, right: -30, opacity: 0.12 }]} />
          <View style={[styles.circle, { width: 80, height: 80, bottom: 10, left: -20, opacity: 0.1 }]} />
        </LinearGradient>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome back 👋</Text>
          <Text style={styles.welcomeSub}>Sign in to continue to your workspace</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email Address"
            placeholder="you@company.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.gray400} />}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.gray400} />}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotRow}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Secure Login</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.trustRow}>
            {[['shield-checkmark-outline', 'Encrypted'], ['lock-closed-outline', 'Secure'], ['eye-off-outline', 'Private']].map(([icon, label]) => (
              <View key={label} style={styles.trustItem}>
                <Ionicons name={icon} size={14} color={COLORS.primary} />
                <Text style={styles.trustText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>© 2024 NAT IT Services. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: COLORS.background },
  banner: { height: 220, padding: 24, paddingTop: 50, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logoBox: { marginBottom: 12 },
  logoCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  appName: { fontSize: 22, fontWeight: '900', color: COLORS.white, letterSpacing: 1 },
  tagline: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  circle: { position: 'absolute', borderRadius: 100, backgroundColor: COLORS.white },
  card: { margin: 16, marginTop: -24, backgroundColor: COLORS.white, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  welcomeSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.dangerLight, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.dangerBorder },
  errorText: { fontSize: 13, color: COLORS.danger, flex: 1 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 8, marginTop: -4 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.gray100 },
  dividerText: { fontSize: 12, color: COLORS.textMuted, marginHorizontal: 12 },
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 12, color: COLORS.textMuted },
  footer: { textAlign: 'center', fontSize: 11, color: COLORS.gray400, padding: 20 },
});
