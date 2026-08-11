import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;
const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '—';

export default function SalaryAssignmentScreen({ navigation }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    client.get('/payroll/salary-assignment').then(unwrap)
      .then(res => setAssignments(Array.isArray(res) ? res : (res?.rows || [])))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter(a =>
    (a.employee_name || a.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.structure_name || a.salary_structure || '').toLowerCase().includes(search.toLowerCase())
  );

  const reassign = (item) => {
    Alert.alert('Reassign Salary Structure',
      `Employee: ${item.employee_name || item.full_name}\nCurrent: ${item.structure_name || 'None'}\n\nContact HR to change salary structure assignment.`
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => reassign(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.employee_name || item.full_name || 'E').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.empName}>{item.employee_name || item.full_name}</Text>
        <Text style={styles.empId}>{item.employee_id || item.emp_code} · {item.department || ''}</Text>
        <View style={styles.structureBadge}>
          <Text style={styles.structureText}>{item.structure_name || item.salary_structure || 'No structure'}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={styles.ctc}>{fmt(item.ctc || item.annual_ctc)}</Text>
        <Text style={styles.ctcLabel}>Annual CTC</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salary Assignment</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray400} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Search employee or structure..." placeholderTextColor={COLORS.gray300} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={filtered} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="person-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No salary assignments found</Text>
            </View>
          } />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: COLORS.gray100 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.secondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empId: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  structureBadge: { backgroundColor: COLORS.primary + '15', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  structureText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  ctc: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  ctcLabel: { fontSize: 10, color: COLORS.gray400, fontWeight: '600' },
  emptyText: { fontSize: 15, color: COLORS.gray400 },
});
