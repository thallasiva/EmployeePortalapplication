import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../../constants/colors';

export default function Input({
  label, placeholder, value, onChangeText, error,
  secureTextEntry, keyboardType, leftIcon, rightIcon,
  multiline, numberOfLines, editable = true, style,
  onRightIconPress, hint,
})
{
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.container,
        focused && styles.focused,
        error && styles.hasError,
        !editable && styles.disabled,
        SHADOW.small,
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon && { paddingLeft: 8 }, multiline && { height: numberOfLines * 22, textAlignVertical: 'top', paddingTop: 12 }]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPass}
          keyboardType={keyboardType || 'default'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.rightIcon}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>{rightIcon}</TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.gray200,
    paddingHorizontal: 14,
  },
  focused: { borderColor: COLORS.primary },
  hasError: { borderColor: COLORS.danger },
  disabled: { backgroundColor: COLORS.gray50 },
  input: { flex: 1, fontSize: 14, color: COLORS.text, paddingVertical: 13 },
  leftIcon: { marginRight: 10 },
  rightIcon: { padding: 4, marginLeft: 8 },
  error: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
});
