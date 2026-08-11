import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const VARIANTS = {
  success: { bg: COLORS.successLight, text: COLORS.success, border: COLORS.successBorder },
  danger: { bg: COLORS.dangerLight, text: COLORS.danger, border: COLORS.dangerBorder },
  warning: { bg: COLORS.warningLight, text: COLORS.warning, border: COLORS.warningBorder },
  info: { bg: COLORS.infoLight, text: COLORS.info, border: COLORS.infoBorder },
  primary: { bg: COLORS.primaryLight, text: COLORS.primary, border: COLORS.primaryBorder },
  gray: { bg: COLORS.gray100, text: COLORS.gray600, border: COLORS.gray200 },
};

export default function Badge({ label, variant = 'gray', size = 'sm', dot = false, style })
{
  const v = VARIANTS[variant] || VARIANTS.gray;
  return (
    <View style={[styles.base, { backgroundColor: v.bg, borderColor: v.border }, size === 'xs' && styles.xs, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: v.text }]} />}
      <Text style={[styles.text, { color: v.text, fontSize: size === 'xs' ? 10 : 11 }]}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  xs: { paddingHorizontal: 6, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text: { fontWeight: '600', letterSpacing: 0.2 },
});
