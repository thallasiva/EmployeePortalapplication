import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function LoadingSpinner({ message = 'Loading…', fullScreen = false })
{
  return (
    <View style={[styles.container, fullScreen && styles.full]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  full: { flex: 1, backgroundColor: COLORS.background },
  text: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
});
