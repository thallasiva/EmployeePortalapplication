/**
 * DatePickerField — tap to open a native-style date picker modal.
 * Works without @react-native-community/datetimepicker.
 * Uses three FlatList column pickers for Day / Month / Year.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ITEM_H = 44;
const VISIBLE = 5;

function range(start, end) {
  const r = [];
  for (let i = start; i <= end; i++) r.push(i);
  return r;
}

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (!isNaN(d)) return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  return null;
}

function formatDate(day, month, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplay(value) {
  const d = parseDate(value);
  if (!d) return '';
  return `${String(d.day).padStart(2, '0')} ${MONTHS[d.month - 1]} ${d.year}`;
}

function Column({ data, selected, onSelect }) {
  const ref = useRef(null);
  const idx = data.indexOf(selected);

  useEffect(() => {
    if (ref.current && idx >= 0) {
      ref.current.scrollToIndex({ index: idx, animated: false, viewPosition: 0.5 });
    }
  }, []);

  return (
    <View style={col.wrap}>
      <View pointerEvents="none" style={col.highlight} />
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={v => String(v)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
        onMomentumScrollEnd={e => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          onSelect(data[Math.max(0, Math.min(i, data.length - 1))]);
        }}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
        renderItem={({ item }) => (
          <View style={[col.item, item === selected && col.itemSelected]}>
            <Text style={[col.itemText, item === selected && col.itemTextSelected]}>
              {typeof item === 'number' && data.length <= 12 && data[0] === 1 && data.length === MONTHS.length
                ? MONTHS[item - 1]
                : String(item).padStart(item < 100 ? 2 : 4, '0')}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const MonthColumn = ({ data, selected, onSelect }) => {
  const ref = useRef(null);
  const idx = data.indexOf(selected);

  useEffect(() => {
    if (ref.current && idx >= 0) {
      ref.current.scrollToIndex({ index: idx, animated: false, viewPosition: 0.5 });
    }
  }, []);

  return (
    <View style={col.wrap}>
      <View pointerEvents="none" style={col.highlight} />
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={v => String(v)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
        onMomentumScrollEnd={e => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          onSelect(data[Math.max(0, Math.min(i, data.length - 1))]);
        }}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
        renderItem={({ item }) => (
          <View style={[col.item, item === selected && col.itemSelected]}>
            <Text style={[col.itemText, item === selected && col.itemTextSelected]}>
              {MONTHS[item - 1]}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default function DatePickerField({
  label, value, onChange, placeholder = 'Select date',
  containerStyle, minYear, maxYear,
}) {
  const now = new Date();
  const parsed = parseDate(value);
  const initDay = parsed?.day ?? now.getDate();
  const initMonth = parsed?.month ?? (now.getMonth() + 1);
  const initYear = parsed?.year ?? now.getFullYear();

  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(initDay);
  const [month, setMonth] = useState(initMonth);
  const [year, setYear] = useState(initYear);

  const minY = minYear ?? (now.getFullYear() - 80);
  const maxY = maxYear ?? (now.getFullYear() + 5);

  const days = range(1, daysInMonth(month, year));
  const months = range(1, 12);
  const years = range(minY, maxY);

  const handleDone = () => {
    const safeDay = Math.min(day, daysInMonth(month, year));
    onChange(formatDate(safeDay, month, year));
    setOpen(false);
  };

  return (
    <>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={[styles.field, containerStyle]} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.gray400} style={{ marginRight: 8 }} />
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.gray400} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{label || 'Select Date'}</Text>
              <TouchableOpacity onPress={handleDone}>
                <Text style={styles.doneBtn}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.columns}>
              <Column data={days} selected={day} onSelect={setDay} />
              <MonthColumn data={months} selected={month} onSelect={setMonth} />
              <Column data={years} selected={year} onSelect={setYear} />
            </View>
            <View style={styles.colLabels}>
              <Text style={styles.colLabel}>Day</Text>
              <Text style={styles.colLabel}>Month</Text>
              <Text style={styles.colLabel}>Year</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const col = StyleSheet.create({
  wrap: { flex: 1, height: ITEM_H * VISIBLE, overflow: 'hidden' },
  highlight: {
    position: 'absolute', top: ITEM_H * Math.floor(VISIBLE / 2), left: 4, right: 4,
    height: ITEM_H, borderRadius: 8, backgroundColor: COLORS.primary + '15',
    borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: COLORS.primary + '40', zIndex: 1,
  },
  item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemSelected: {},
  itemText: { fontSize: 16, color: COLORS.gray400, fontWeight: '500' },
  itemTextSelected: { fontSize: 18, color: COLORS.primary, fontWeight: '800' },
});

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#f9fafb', marginBottom: 14 },
  fieldText: { flex: 1, fontSize: 14, color: COLORS.secondary, fontWeight: '600' },
  fieldPlaceholder: { color: COLORS.gray300, fontWeight: '400' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  cancelBtn: { fontSize: 15, color: COLORS.gray500, fontWeight: '600' },
  doneBtn: { fontSize: 15, color: COLORS.primary, fontWeight: '800' },
  columns: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 },
  colLabels: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 4 },
  colLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: COLORS.gray400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
