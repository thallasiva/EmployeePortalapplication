import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { employeeApi } from '../../api/employee.api';
import { getInitials } from '../../utils/formatters';

const DEPT_COLORS = ['#f18200','#7c3aed','#0891b2','#16a34a','#dc2626','#db2777','#059669','#2563eb'];

export default function PeopleScreen({ navigation }) {
  const [people, setPeople] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const res = await employeeApi.list({ status: 'active', limit: 200 });
      const data = res.data?.employees || res.data || [];
      setPeople(data);
      setFiltered(data);
      const depts = ['All', ...new Set(data.map(e => e.department).filter(Boolean))];
      setDepartments(depts);
    } catch { setPeople([]); setFiltered([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPeople(); }, []);

  useEffect(() => {
    let result = people;
    if (selectedDept !== 'All') result = result.filter(p => p.department === selectedDept);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => (p.full_name || '').toLowerCase().includes(q) || (p.designation || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [search, selectedDept, people]);

  const getColor = (dept) => DEPT_COLORS[departments.indexOf(dept) % DEPT_COLORS.length];

  const renderPerson = ({ item }) => {
    const name = item.full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim();
    const color = getColor(item.department);
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PeopleDetail', { employeeId: item.id })}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.designation}>{item.designation || item.job_title}</Text>
          <Text style={styles.dept}>{item.department}</Text>
        </View>
        <View style={styles.contactBtns}>
          {item.email && <TouchableOpacity style={styles.iconBtn}><Ionicons name="mail-outline" size={16} color={COLORS.primary} /></TouchableOpacity>}
          {item.phone && <TouchableOpacity style={styles.iconBtn}><Ionicons name="call-outline" size={16} color={COLORS.primary} /></TouchableOpacity>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>People Directory</Text>
        <Text style={styles.count}>{filtered.length}</Text>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray400} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search by name, role..." value={search} onChangeText={setSearch} placeholderTextColor={COLORS.gray300} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={COLORS.gray400} /></TouchableOpacity> : null}
      </View>
      <FlatList
        data={departments}
        keyExtractor={d => d}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.deptContainer}
        style={styles.deptScroll}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedDept(item)} style={[styles.deptChip, selectedDept === item && styles.deptChipActive]}>
            <Text style={[styles.deptChipText, selectedDept === item && styles.deptChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderPerson}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPeople} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="people-outline" size={48} color={COLORS.gray300} /><Text style={styles.emptyText}>No people found</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  count: { fontSize: 13, color: COLORS.gray400, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginVertical: 10, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.gray200 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.secondary },
  deptScroll: { maxHeight: 48, backgroundColor: COLORS.white },
  deptContainer: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  deptChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  deptChipActive: { backgroundColor: COLORS.primary },
  deptChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
  deptChipTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  designation: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  dept: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  contactBtns: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});
