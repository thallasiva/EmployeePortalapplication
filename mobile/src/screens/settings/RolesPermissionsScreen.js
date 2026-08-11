import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;

const ROLE_ICONS = { Admin: 'shield-outline', Manager: 'briefcase-outline', Employee: 'person-outline', HR: 'people-outline' };
const ROLE_COLORS = { Admin: COLORS.danger, Manager: COLORS.primary, Employee: COLORS.success, HR: '#7c3aed' };

export default function RolesPermissionsScreen({ navigation }) {
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleEmployees, setRoleEmployees] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async () => {
    const [rolesRes, empRes] = await Promise.all([
      client.get('/employees/roles/list').then(unwrap).catch(() => []),
      client.get('/employees', { params: { limit: 500, status: 'Active' } }).then(unwrap).catch(() => []),
    ]);
    const rolesArr = Array.isArray(rolesRes) ? rolesRes : rolesRes?.data || [];
    const empArr = Array.isArray(empRes) ? empRes : empRes?.data || [];
    setRoles(rolesArr);
    setEmployees(empArr);
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { fetch(); }, [fetch]);

  const viewRoleEmployees = (role) => {
    setSelectedRole(role);
    const roleName = role.role_name || role.name;
    const filtered = employees.filter(e => (e.role_name || '').toLowerCase() === roleName.toLowerCase());
    setRoleEmployees(filtered);
    setModalVisible(true);
  };

  const handleChangeRole = async (empId, roleId) => {
    try {
      await client.put(`/employees/${empId}/role`, { role_id: roleId });
      Alert.alert('Updated', 'Employee role updated.');
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const renderRole = ({ item }) => {
    const roleName = item.role_name || item.name || 'Role';
    const color = ROLE_COLORS[roleName] || COLORS.primary;
    const icon = ROLE_ICONS[roleName] || 'shield-outline';
    const empCount = employees.filter(e => (e.role_name || '').toLowerCase() === roleName.toLowerCase()).length;

    return (
      <TouchableOpacity style={styles.roleCard} onPress={() => viewRoleEmployees(item)}>
        <View style={[styles.roleIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roleName}>{roleName}</Text>
          <Text style={styles.roleSub}>{empCount} employee{empCount !== 1 ? 's' : ''}</Text>
          {item.description && <Text style={styles.roleDesc} numberOfLines={1}>{item.description}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[styles.badge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.badgeText, { color }]}>{empCount}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray300} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Roles & Permissions</Text>
          <Text style={styles.subtitle}>Manage employee roles and access</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{roles.length}</Text>
          <Text style={styles.summaryLabel}>Roles</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{employees.length}</Text>
          <Text style={styles.summaryLabel}>Employees</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{employees.filter(e => e.role_name === 'Admin').length}</Text>
          <Text style={styles.summaryLabel}>Admins</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item, i) => String(item.role_id || item.id || i)}
          renderItem={renderRole}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListHeaderComponent={() => <Text style={styles.listHeader}>{roles.length} role{roles.length !== 1 ? 's' : ''} configured</Text>}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="shield-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyTitle}>No roles configured</Text>
            </View>
          )}
        />
      )}

      {/* Role employees modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>{selectedRole?.role_name || 'Role'} Members</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginLeft: 'auto' }}>
                <Ionicons name="close" size={22} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {roleEmployees.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No employees in this role</Text>
                </View>
              ) : roleEmployees.map((emp, i) => (
                <View key={emp.employee_id || i} style={styles.empRow}>
                  <View style={styles.empAvatar}>
                    <Text style={styles.empAvatarText}>{(emp.full_name || '?').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.empName}>{emp.full_name}</Text>
                    <Text style={styles.empSub}>{emp.department_name || ''} · {emp.emp_code || ''}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  subtitle: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  summaryRow: { flexDirection: 'row', padding: 16, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  summaryNum: { fontSize: 24, fontWeight: '900', color: COLORS.secondary },
  summaryLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: { fontSize: 12, fontWeight: '700', color: COLORS.gray400, marginBottom: 4 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  roleIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  roleName: { fontSize: 15, fontWeight: '800', color: COLORS.secondary },
  roleSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  roleDesc: { fontSize: 11, color: COLORS.gray300, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.gray400 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  empAvatar: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  empAvatarText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  empName: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empSub: { fontSize: 11, color: COLORS.gray400, marginTop: 1 },
});
