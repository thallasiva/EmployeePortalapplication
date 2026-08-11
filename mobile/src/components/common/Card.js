import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SHADOW } from '../../constants/colors';

export default function Card({ children, style, padding = 16 })
{
  return (
    <View style={[styles.card, { padding }, SHADOW.small, style]}>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray100 },
});
