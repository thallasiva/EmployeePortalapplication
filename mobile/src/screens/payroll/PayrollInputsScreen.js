import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  FlatList, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';
import DatePickerField from '../../components/DatePickerField';

const unwrap = r => r.data?.data ?? r.data;
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TABS = [
  { key: 'lop', label: 'LOP Days', icon: 'remove-circle-outline' },
  { key: 'overtime', label: 'Overtime', icon: 'time-outline' },
  { key: 'arrears', label: 'Arrears', icon: 'cash-outline' },
  { key: 'stop', label: 'Stop Salary', icon: 'pause-circle-outline' },
];

function monthStr(m, y) { return `${MONTHS_SHORT[m-1]} ${y}`; }

export default function PayrollInputsScreen({ navigation }) {
  const now = new Date();
  const [tab, setTab] = useState('lop');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  // LOP state
  const [lopData, setLopData] = useState([]);
  // Overtime state
  const [otData, setOtData] = useState([]);
  // Arrears
  const [arrearsForm, setArrearsForm] = useState({ employee_id: '', amount: '', description: '', effective_month: '' });
  // Stop salary
  const [stopForm, setStopForm] = useState({ employee_id: '', reason: '', from_date: '' });

  const loadEmployees = useCallback(async () => {
    try {
      const res = await client.get('/employees', { params: { status: 'Active', limit: 500 } }).then(unwrap);
      const rows = Array.isArray(res) ? res : (res?.employees || res?.data || []);
      setEmployees(rows);
    } catch (e) { console.log('emp load', e?.message); }
  }, []);

  const loadLOP = useCallback(async () => {
    if (tab !== 'lop') return;
    setLoading(true);
    try {
      const res = await client.get('/payroll/lop', { params: { month, year } }).then(unwrap).catch(() => []);
      const rows = Array.isArray(res) ? res : [];
      setLopData(rows);
    } catch { setLopData([]); }
    setLoading(false);
  }, [tab, month, year]);

  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => { loadLOP(); }, [loadLOP]);

  const saveLOP = async (empId, days) => {
    try {
      await client.post('/payroll/lop', { employee_id: empId, lop_days: Number(days), month, year });
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Save failed'); }
  };

  const saveArrears = async () => {
    if (!arrearsForm.employee_id || !arrearsForm.amount) { Alert.alert('Required', 'Select employee and enter amount'); return; }
    setSaving(true);
    try {
      await client.post('/payroll/arrears', arrearsForm);
      Alert.alert('Success', 'Arrears saved');
      setArrearsForm({ employee_id: '', amount: '', description: '', effective_month: '' });
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const saveStop = async () => {
    if (!stopForm.employee_id || !stopForm.from_date) { Alert.alert('Required', 'Select employee and date'); return; }
    setSaving(true);
    try {
      await client.post('/payroll/stop-salary', stopForm);
      Alert.alert('Success', 'Salary hold applied');
      setStopForm({ employee_id: '', reason: '', from_date: '' });
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const filtered = employees.filter(e => {
    const n = (e.full_name || e.first_name || '').toLowerCase();
    return !searchQ || n.includes(searchQ.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Payroll Inputs</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Month selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={styles.monthRow}>
        {[-2,-1,0,1,2].map(offset => {
          const d = new Date(year, month - 1 + offset, 1);
          const m2 = d.getMonth() + 1; const y2 = d.getFullYear();
          const active = m2 === month && y2 === year;
          return (
            <TouchableOpacity key={offset} onPress={() => { setMonth(m2); setYear(y2); }} style={[styles.monthChip, active && styles.monthChipActive]}>
              <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>{monthStr(m2, y2)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tabChip, tab === t.key && styles.tabChipActive]}>
            <Ionicons name={t.icon} size={14} color={tab === t.key ? COLORS.white : COLORS.gray500} />
            <Text style={[styles.tabChipText, tab === t.key && styles.tabChipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* LOP Days */}
        {tab === 'lop' && (
          <>
            <Text style={styles.sectionDesc}>Enter Loss of Pay (LOP) days per employee for {monthStr(month, year)}</Text>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={15} color={COLORS.gray400} />
              <TextInput style={styles.searchInput} value={searchQ} onChangeText={setSearchQ} placeholder="Search employee..." placeholderTextColor={COLORS.gray300} />
            </View>
            {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} /> : (
              filtered.map(emp => {
                const existing = lopData.find(l => l.employee_id === emp.employee_id);
                const [days, setDays] = useState(String(existing?.lop_days || '0'));
                return (
                  <View key={emp.employee_id} style={styles.empRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.empName}>{emp.full_name || `${emp.first_name} ${emp.last_name}`}</Text>
                      <Text style={styles.empSub}>{emp.department_name || ''}</Text>
                    </View>
                    <View style={styles.lopInput}>
                      <TouchableOpacity onPress={() => { const v = Math.max(0, Number(days) - 1); setDays(String(v)); saveLOP(emp.employee_id, v); }}>
                        <Ionicons name="remove-circle-outline" size={24} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TextInput style={styles.lopDays} value={days} onChangeText={setDays}
                        onBlur={() => saveLOP(emp.employee_id, days)}
                        keyboardType="numeric" textAlign="center" />
                      <TouchableOpacity onPress={() => { const v = Number(days) + 1; setDays(String(v)); saveLOP(emp.employee_id, v); }}>
                        <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Overtime */}
        {tab === 'overtime' && (
          <>
            <Text style={styles.sectionDesc}>Record overtime hours for {monthStr(month, year)}</Text>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={15} color={COLORS.gray400} />
              <TextInput style={styles.searchInput} value={searchQ} onChangeText={setSearchQ} placeholder="Search employee..." placeholderTextColor={COLORS.gray300} />
            </View>
            {filtered.map(emp => {
              const [hrs, setHrs] = useState('0');
              const [rate, setRate] = useState('');
              return (
                <View key={emp.employee_id} style={[styles.empRow, { flexDirection: 'column', gap: 8 }]}>
                  <Text style={styles.empName}>{emp.full_name || `${emp.first_name} ${emp.last_name}`}</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Hours</Text>
                      <TextInput style={styles.smallInput} value={hrs} onChangeText={setHrs} keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Rate/hr (₹)</Text>
                      <TextInput style={styles.smallInput} value={rate} onChangeText={setRate} keyboardType="numeric" placeholder="Auto" />
                    </View>
                    <TouchableOpacity style={styles.saveBtn} onPress={async () => {
                      try {
                        await client.post('/payroll/overtime', { employee_id: emp.employee_id, hours: Number(hrs), rate_per_hour: rate ? Number(rate) : undefined, month, year });
                        Alert.alert('Saved', 'Overtime recorded');
                      } catch { Alert.alert('Error', 'Save failed'); }
                    }}>
                      <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Arrears */}
        {tab === 'arrears' && (
          <>
            <Text style={styles.sectionDesc}>Add salary arrears for any employee</Text>
            <Text style={styles.inputLabel}>Employee *</Text>
            <ScrollView style={styles.empPickerBox} nestedScrollEnabled>
              {employees.slice(0,20).map(e => (
                <TouchableOpacity key={e.employee_id} onPress={() => setArrearsForm(f => ({ ...f, employee_id: e.employee_id }))}
                  style={[styles.empPickItem, arrearsForm.employee_id === e.employee_id && styles.empPickItemActive]}>
                  <Text style={[styles.empPickText, arrearsForm.employee_id === e.employee_id && { color: COLORS.primary, fontWeight: '700' }]}>
                    {e.full_name || `${e.first_name} ${e.last_name}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>Amount (₹) *</Text>
            <TextInput style={styles.input} value={arrearsForm.amount} onChangeText={v => setArrearsForm(f => ({...f, amount: v}))} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.gray300} />
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput style={[styles.input, {minHeight:60}]} value={arrearsForm.description} onChangeText={v => setArrearsForm(f => ({...f, description: v}))} placeholder="Reason for arrears" placeholderTextColor={COLORS.gray300} multiline textAlignVertical="top" />
            <TouchableOpacity style={styles.primaryBtn} onPress={saveArrears} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Save Arrears</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* Stop Salary */}
        {tab === 'stop' && (
          <>
            <Text style={styles.sectionDesc}>Place salary on hold for an employee</Text>
            <Text style={styles.inputLabel}>Employee *</Text>
            <ScrollView style={styles.empPickerBox} nestedScrollEnabled>
              {employees.slice(0,20).map(e => (
                <TouchableOpacity key={e.employee_id} onPress={() => setStopForm(f => ({ ...f, employee_id: e.employee_id }))}
                  style={[styles.empPickItem, stopForm.employee_id === e.employee_id && styles.empPickItemActive]}>
                  <Text style={[styles.empPickText, stopForm.employee_id === e.employee_id && { color: COLORS.primary, fontWeight: '700' }]}>
                    {e.full_name || `${e.first_name} ${e.last_name}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <DatePickerField label="From Date *" value={stopForm.from_date} onChange={v => setStopForm(f => ({...f, from_date: v}))} />
            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput style={[styles.input, {minHeight:60}]} value={stopForm.reason} onChangeText={v => setStopForm(f => ({...f, reason: v}))} placeholder="Reason for salary hold" placeholderTextColor={COLORS.gray300} multiline textAlignVertical="top" />
            <TouchableOpacity style={[styles.primaryBtn, {backgroundColor: COLORS.danger}]} onPress={saveStop} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Apply Hold</Text>}
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  back:{width:36,height:36,justifyContent:'center'},
  title:{fontSize:17,fontWeight:'700',color:COLORS.secondary},
  monthScroll:{maxHeight:52,backgroundColor:COLORS.white},
  monthRow:{paddingHorizontal:12,paddingVertical:8,gap:8,flexDirection:'row'},
  monthChip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:COLORS.gray100},
  monthChipActive:{backgroundColor:COLORS.primary},
  monthChipText:{fontSize:13,fontWeight:'600',color:COLORS.gray500},
  monthChipTextActive:{color:COLORS.white},
  tabScroll:{maxHeight:48,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  tabRow:{paddingHorizontal:12,paddingVertical:8,gap:8,flexDirection:'row'},
  tabChip:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:12,paddingVertical:6,borderRadius:20,backgroundColor:COLORS.gray100},
  tabChipActive:{backgroundColor:COLORS.primary},
  tabChipText:{fontSize:12,fontWeight:'600',color:COLORS.gray500},
  tabChipTextActive:{color:COLORS.white},
  sectionDesc:{fontSize:13,color:COLORS.gray500,marginBottom:14},
  searchRow:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.white,marginBottom:10,paddingHorizontal:12,paddingVertical:8,borderRadius:10,borderWidth:1,borderColor:COLORS.gray200,gap:6},
  searchInput:{flex:1,fontSize:14,color:COLORS.secondary},
  empRow:{backgroundColor:COLORS.white,borderRadius:12,padding:12,marginBottom:8,flexDirection:'row',alignItems:'center',shadowColor:'#000',shadowOpacity:0.03,shadowRadius:3,elevation:1},
  empName:{fontSize:13,fontWeight:'700',color:COLORS.secondary},
  empSub:{fontSize:11,color:COLORS.gray500},
  lopInput:{flexDirection:'row',alignItems:'center',gap:8},
  lopDays:{width:40,height:36,borderWidth:1.5,borderColor:COLORS.gray200,borderRadius:8,fontSize:15,fontWeight:'700',color:COLORS.secondary,textAlign:'center'},
  inputLabel:{fontSize:11,fontWeight:'700',color:COLORS.gray500,textTransform:'uppercase',letterSpacing:0.5,marginBottom:5},
  smallInput:{borderWidth:1.5,borderColor:COLORS.gray200,borderRadius:8,padding:8,fontSize:13,color:COLORS.secondary},
  saveBtn:{backgroundColor:COLORS.primary,paddingHorizontal:14,paddingVertical:9,borderRadius:8,justifyContent:'center'},
  saveBtnText:{fontSize:12,fontWeight:'700',color:COLORS.white},
  input:{borderWidth:1.5,borderColor:COLORS.gray200,borderRadius:10,padding:12,fontSize:14,color:COLORS.secondary,marginBottom:14,backgroundColor:'#f9fafb'},
  primaryBtn:{backgroundColor:COLORS.primary,paddingVertical:14,borderRadius:12,alignItems:'center',marginTop:8},
  primaryBtnText:{fontSize:15,fontWeight:'800',color:COLORS.white},
  empPickerBox:{maxHeight:160,borderWidth:1.5,borderColor:COLORS.gray200,borderRadius:10,marginBottom:14,backgroundColor:'#f9fafb'},
  empPickItem:{paddingHorizontal:14,paddingVertical:10,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  empPickItemActive:{backgroundColor:COLORS.primary+'10'},
  empPickText:{fontSize:13,color:COLORS.gray600||COLORS.gray500},
});
