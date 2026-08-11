import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { employeeApi } from '../../api/employee.api';
import { COLORS, SHADOW } from '../../constants/colors';
import { getInitials, formatDate } from '../../utils/formatters';
import SearchBar from '../../components/common/SearchBar';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { ROUTES } from '../../constants/routes';

const DEPT_COLORS = ['#7c3aed', '#0284c7', '#16a34a', '#d97706', '#db2777', '#0891b2'];

export default function EmployeeListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeeApi.list({ limit: 200, status: 'active' });
      const data = Array.isArray(res) ? res : res?.data || res?.employees || [];
      setEmployees(data);
      setFiltered(data);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(employees); return; }
    const q = search.toLowerCase();
    setFiltered(employees.filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.designation_name?.toLowerCase().includes(q) ||
      e.department_name?.toLowerCase().includes(q) ||
      e.emp_code?.toLowerCase().includes(q)
    ));
  }, [search, employees]);

  const onRefresh = async () => { setRefreshing(true); await fetchEmployees(); setRefreshing(false); };

  const getAvatarColor = (name) => DEPT_COLORS[Math.abs(name?.charCodeAt(0) || 0) % DEPT_COLORS.length];

  const renderItem = ({ item }) => {
    const name = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    const color = getAvatarColor(name);
    return (
      <TouchableOpacity
        style={[styles.empCard, SHADOW.small]}
        onPress={() => navigation.navigate(ROUTES.EMPLOYEE_DETAIL, { id: item.employee_id || item.id })}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
        <View style={styles.empInfo}>
          <Text style={styles.empName}>{name}</Text>
          <Text style={styles.empDesig}>{item.designation_name || '—'}</Text>
          <View style={styles.empMeta}>
            <Ionicons name="business-outline" size={11} color={COLORS.gray400} />
            <Text style={styles.empMetaText}>{item.department_name || '—'}</Text>
            {item.emp_code && <Text style={styles.empCode}>· {item.emp_code}</Text>}
          </View>
        </View>
        <View style={styles.empRight}>
          <Badge label={item.employee_status || item.status || 'Active'} variant={((item.employee_status||item.status||'Active').toLowerCase() === 'active') ? 'success' : 'gray'} size="xs" />
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray300} style={{ marginTop: 8 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Employees</Text>
          <Text style={styles.headerSub}>{filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate(ROUTES.EMPLOYEE_CREATE)}
        >
          <Ionicons name="person-add-outline" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name, dept, code…" />
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => String(item.employee_id || item.id || i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 120, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No employees found" subtitle={search ? 'Try a different search term' : 'No employees added yet'} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { padding: 12, paddingBottom: 6 },
  empCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.gray100 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  empInfo: { flex: 1 },
  empName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  empDesig: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  empMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empMetaText: { fontSize: 11, color: COLORS.gray400 },
  empCode: { fontSize: 11, color: COLORS.gray400 },
  empRight: { alignItems: 'flex-end' },
});
