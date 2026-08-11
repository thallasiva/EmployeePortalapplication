import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, style, textStyle, fullWidth = false,
})
{
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const isSuccess = variant === 'success';

  const getBg = () =>
  {
    if (disabled) return COLORS.gray200;
    if (isOutline || isGhost) return 'transparent';
    if (isDanger) return COLORS.danger;
    if (isSuccess) return COLORS.success;
    return COLORS.primary;
  };

  const getBorder = () =>
  {
    if (isOutline) return isDanger ? COLORS.danger : COLORS.primary;
    return 'transparent';
  };

  const getTextColor = () =>
  {
    if (disabled) return COLORS.gray400;
    if (isOutline) return isDanger ? COLORS.danger : COLORS.primary;
    if (isGhost) return COLORS.primary;
    return COLORS.white;
  };

  const getPadding = () =>
  {
    if (size === 'sm') return { paddingVertical: 8, paddingHorizontal: 14 };
    if (size === 'lg') return { paddingVertical: 16, paddingHorizontal: 28 };
    return { paddingVertical: 13, paddingHorizontal: 20 };
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        { backgroundColor: getBg(), borderColor: getBorder(), borderWidth: isOutline ? 1.5 : 0 },
        getPadding(),
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? COLORS.primary : COLORS.white} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={{ marginRight: title ? 7 : 0 }}>{icon}</View>}
          {title && <Text style={[styles.text, { color: getTextColor(), fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14 }, textStyle]}>{title}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { fontWeight: '600', letterSpacing: 0.2 },
});
