import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { calendarApi } from '../../api/calendar.api';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EVENT_COLORS = { holiday: COLORS.danger, birthday: '#db2777', leave: COLORS.warning, event: COLORS.primary, meeting: COLORS.info, review: '#7c3aed' };

export default function CalendarScreen({ navigation }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async (y, m) => {
    setLoading(true);
    try {
      const res = await calendarApi.events({ month: m + 1, year: y });
      setEvents(Array.isArray(res) ? res : (res?.events || res?.items || []));
    } catch { setEvents([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(year, month); }, [year, month]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => (e.date || e.event_date || '').startsWith(dateStr));
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const calendarCells = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];
  const rows = [];
  for (let i = 0; i < calendarCells.length; i += 7) rows.push(calendarCells.slice(i, i + 7));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchEvents(year, month)} colors={[COLORS.primary]} />}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Ionicons name="chevron-back" size={20} color={COLORS.secondary} /></TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Ionicons name="chevron-forward" size={20} color={COLORS.secondary} /></TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map(d => <Text key={d} style={[styles.dayHeader, (d === 'Sun' || d === 'Sat') && styles.weekendHeader]}>{d}</Text>)}
        </View>

        {/* Calendar grid */}
        <View style={styles.calGrid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.calRow}>
              {row.map((day, di) => {
                if (!day) return <View key={di} style={styles.calCell} />;
                const dayEvents = getEventsForDate(day);
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                const isSelected = day === selectedDate;
                const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6;
                return (
                  <TouchableOpacity key={di} style={[styles.calCell, isSelected && styles.calCellSelected]} onPress={() => setSelectedDate(day === selectedDate ? null : day)}>
                    <View style={[styles.dayNum, isToday && styles.dayNumToday]}>
                      <Text style={[styles.dayText, isWeekend && styles.weekendText, isToday && styles.dayTextToday, isSelected && styles.dayTextSelected]}>{day}</Text>
                    </View>
                    <View style={styles.eventDots}>
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: EVENT_COLORS[e.type] || COLORS.primary }]} />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            </View>
          ))}
        </View>

        {/* Selected date events */}
        {selectedDate && (
          <View style={styles.eventsSection}>
            <Text style={styles.eventsSectionTitle}>{MONTHS[month]} {selectedDate}</Text>
            {selectedEvents.length === 0 ? (
              <View style={styles.noEventsRow}><Text style={styles.noEventsText}>No events</Text></View>
            ) : (
              selectedEvents.map((e, i) => (
                <View key={i} style={[styles.eventCard, { borderLeftColor: EVENT_COLORS[e.type] || COLORS.primary }]}>
                  <Text style={styles.eventTitle}>{e.title || e.name}</Text>
                  <Text style={styles.eventDesc}>{e.description || e.type}</Text>
                  {e.time && <Text style={styles.eventTime}><Ionicons name="time-outline" size={12} /> {e.time}</Text>}
                </View>
              ))
            )}
          </View>
        )}

        {/* Upcoming events */}
        <View style={styles.upcomingSection}>
          <Text style={styles.upcomingTitle}>Upcoming Events</Text>
          {events.slice(0, 5).map((e, i) => (
            <View key={i} style={styles.upcomingCard}>
              <View style={[styles.upcomingDot, { backgroundColor: EVENT_COLORS[e.type] || COLORS.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.upcomingName}>{e.title || e.name}</Text>
                <Text style={styles.upcomingDate}>{e.date || e.event_date}</Text>
              </View>
              <Text style={[styles.upcomingType, { color: EVENT_COLORS[e.type] || COLORS.primary }]}>{e.type}</Text>
            </View>
          ))}
          {events.length === 0 && !loading && <Text style={styles.noEventsText}>No upcoming events this month</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '800', color: COLORS.secondary },
  dayHeaders: { flexDirection: 'row', paddingHorizontal: 8, backgroundColor: COLORS.white, paddingBottom: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: COLORS.gray400 },
  weekendHeader: { color: COLORS.danger },
  calGrid: { backgroundColor: COLORS.white, paddingHorizontal: 8, paddingBottom: 12 },
  calRow: { flexDirection: 'row' },
  calCell: { flex: 1, height: 52, alignItems: 'center', paddingTop: 4, borderRadius: 8 },
  calCellSelected: { backgroundColor: COLORS.primary + '10' },
  dayNum: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  dayNumToday: { backgroundColor: COLORS.primary },
  dayText: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },
  weekendText: { color: COLORS.danger },
  dayTextToday: { color: COLORS.white, fontWeight: '800' },
  dayTextSelected: { color: COLORS.primary, fontWeight: '800' },
  eventDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingHorizontal: 16, gap: 10, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.gray500, fontWeight: '600' },
  eventsSection: { padding: 16 },
  eventsSectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.secondary, marginBottom: 10 },
  noEventsRow: { padding: 12 },
  noEventsText: { fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
  eventCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  eventDesc: { fontSize: 12, color: COLORS.gray500, marginTop: 2, textTransform: 'capitalize' },
  eventTime: { fontSize: 12, color: COLORS.gray400, marginTop: 4 },
  upcomingSection: { padding: 16 },
  upcomingTitle: { fontSize: 15, fontWeight: '700', color: COLORS.secondary, marginBottom: 10 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  upcomingDot: { width: 10, height: 10, borderRadius: 5 },
  upcomingName: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },
  upcomingDate: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  upcomingType: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
