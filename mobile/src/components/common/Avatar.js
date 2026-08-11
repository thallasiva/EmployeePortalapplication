import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { getInitials } from '../../utils/formatters';

const SIZES = { xs: 28, sm: 36, md: 44, lg: 56, xl: 72 };
const FONT = { xs: 11, sm: 13, md: 16, lg: 20, xl: 26 };

export default function Avatar({ name, uri, size = 'md', color, style }) {
  const dim = SIZES[size] || 44;
  const fs = FONT[size] || 16;
  const bg = color || COLORS.primary;

  return (
    <View style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: dim, height: dim, borderRadius: dim / 2 }} />
      ) : (
        <Text style={[styles.text, { fontSize: fs }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { color: COLORS.white, fontWeight: '700' },
});
