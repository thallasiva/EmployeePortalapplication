import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../../constants/colors';

export default function StatCard({ label, value, icon, color = COLORS.primary, bg, trend, style })
{
  const cardBg = bg || color + '15';
  return (
    <View style={[styles.card, SHADOW.small, style]}>
      <View style={[styles.iconBox, { backgroundColor: cardBg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.value}>{value ?? '—'}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend !== undefined && (
        <View style={styles.trend}>
          <Ionicons name={trend >= 0 ? 'trending-up' : 'trending-down'} size={13} color={trend >= 0 ? COLORS.success : COLORS.danger} />
          <Text style={[styles.trendText, { color: trend >= 0 ? COLORS.success : COLORS.danger }]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.gray100 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  value: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  label: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  trend: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 3 },
  trendText: { fontSize: 11, fontWeight: '600' },
});
