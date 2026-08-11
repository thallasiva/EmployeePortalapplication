import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOW } from '../../constants/colors';

export default function ScreenHeader({ title, subtitle, onBack, rightAction, navigation })
{
  const insets = useSafeAreaInsets();
  const handleBack = onBack || (navigation?.goBack ? () => navigation.goBack() : null);
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }, SHADOW.small]}>
      <View style={styles.row}>
        {handleBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleBox}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {rightAction ? <View style={styles.right}>{rightAction}</View> : <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  row: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.gray50, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  titleBox: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  right: { marginLeft: 10 },
});
