import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import Button from './Button';

export default function EmptyState({ icon = 'document-outline', title = 'Nothing here', subtitle, action, onAction })
{
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={40} color={COLORS.gray300} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
      {action && <Button title={action} onPress={onAction} style={{ marginTop: 16 }} />}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.gray700, marginBottom: 6, textAlign: 'center' },
  sub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});
