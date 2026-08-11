import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function SearchBar({ value, onChangeText, placeholder = 'Search…', onClear, style })
{
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search-outline" size={18} color={COLORS.gray400} style={{ marginRight: 8 }} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray400}
      />
      {value?.length > 0 && (
        <TouchableOpacity onPress={onClear || (() => onChangeText(''))}>
          <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
        </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderColor: COLORS.gray200 },
  input: { flex: 1, fontSize: 14, color: COLORS.text },
});
