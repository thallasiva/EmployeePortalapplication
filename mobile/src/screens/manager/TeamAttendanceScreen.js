import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { attendanceApi } from '../../api/attendance.api';
import client from '../../api/client';

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const TABS = ['Today', 'Regularizations'];
const STATUS_COLORS = { present: COLORS.success, late: COLORS.warning, absent: COLORS.danger, leave: COLORS.info, 'on leave': COLORS.info };
const getC = s => STATUS_COLORS[(s||'').toLowerCase()] || COLORS.gray400;

export default function TeamAttendanceScreen({ navigation }) {
  const [tab, setTab] = useState('Today');
  const [records, setRecords] = useState([]);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const today = todayStr();
    const [list, regList] = await Promise.all([
      attendanceApi.list({ from_date: today, to_date: today, limit: 200 }).catch(() => []),
      attendanceApi.regularizations({ status: 'Pending', limit: 100 }).catch(() => []),
    ]);
    setRecords(Array.isArray(list) ? list : (list?.data || []));
    setRegs(Array.isArray(regList) ? regList : (regList?.data || regList?.rows || []));
  }, []);

  const fetch = async () => { setLoading(true); await loadData(); setLoading(false); };
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };
  useEffect(() => { fetch(); }, []);

  const submitReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await client.put(`/attendance/regularizations/${reviewModal.id}/review`, {
        status: reviewModal.action === 'approve' ? 'Approved' : 'Rejected', remarks: note,
      });
      setReviewModal(null);
      onRefresh();
    } catch { Alert.alert('Error', 'Action failed.'); }
    finally { setSubmitting(false); }
  };

  const filtered = records.filter(r => {
    const name = (r.employee_name || r.full_name || '').toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Team Attendance</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.back}>
          <Ionicons name="refresh-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab===t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab===t && styles.tabTextActive]}>
              {t}{t==='Regularizations' && regs.length > 0 ? ` (${regs.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Today' ? (
        <>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={COLORS.gray400} style={{marginRight:6}} />
            <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search..." placeholderTextColor={COLORS.gray300} />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item,i) => String(item.attendance_id||item.employee_id||i)}
            renderItem={({ item }) => {
              const s = item.status || 'unknown';
              const c = getC(s);
              return (
                <View style={styles.card}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                    <View style={[styles.dot, {backgroundColor:c}]} />
                    <View style={{flex:1}}>
                      <Text style={styles.empName}>{item.employee_name||item.full_name||'Employee'}</Text>
                      <Text style={styles.empSub}>{item.department_name||''}</Text>
                    </View>
                    <View style={[styles.badge, {backgroundColor:c+'20'}]}>
                      <Text style={[styles.badgeText, {color:c}]}>{s}</Text>
                    </View>
                  </View>
                  <View style={{flexDirection:'row', gap:16, marginTop:8}}>
                    <Text style={styles.time}>In: {item.check_in_time||'—'}</Text>
                    <Text style={styles.time}>Out: {item.check_out_time||'—'}</Text>
                    {item.work_hours != null && <Text style={styles.time}>{Number(item.work_hours).toFixed(1)}h</Text>}
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="people-outline" size={48} color={COLORS.gray300}/><Text style={styles.emptyText}>No records</Text></View>}
          />
        </>
      ) : (
        <FlatList
          data={regs}
          keyExtractor={(item,i) => String(item.regularization_id||item.id||i)}
          renderItem={({ item }) => (
            <View style={styles.regCard}>
              <Text style={styles.empName}>{item.employee_name||item.full_name||'Employee'}</Text>
              <Text style={styles.empSub}>{item.attendance_date||item.date} · {item.reason||'No reason'}</Text>
              <View style={{flexDirection:'row', gap:8, marginTop:10}}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => { setReviewModal({id:item.regularization_id||item.id, action:'reject'}); setNote(''); }}>
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={() => { setReviewModal({id:item.regularization_id||item.id, action:'approve'}); setNote(''); }}>
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.gray300}/><Text style={styles.emptyText}>No pending regularizations</Text></View>}
        />
      )}

      <Modal visible={!!reviewModal} transparent animationType="fade" onRequestClose={() => setReviewModal(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{reviewModal?.action==='approve'?'Approve':'Reject'} Request</Text>
            <TextInput style={styles.modalInput} value={note} onChangeText={setNote} placeholder="Remarks (optional)" placeholderTextColor={COLORS.gray300} multiline />
            <View style={{flexDirection:'row', gap:10, marginTop:12}}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReviewModal(null)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn,{backgroundColor:reviewModal?.action==='approve'?COLORS.success:COLORS.danger}]} onPress={submitReview} disabled={submitting}>
                {submitting ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.confirmText}>{reviewModal?.action==='approve'?'Approve':'Reject'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  back:{width:36,height:36,justifyContent:'center'},
  title:{fontSize:17,fontWeight:'700',color:COLORS.secondary},
  tabBar:{flexDirection:'row',backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  tabBtn:{flex:1,paddingVertical:12,alignItems:'center'},
  tabActive:{borderBottomWidth:2.5,borderBottomColor:COLORS.primary},
  tabText:{fontSize:13,fontWeight:'600',color:COLORS.gray500},
  tabTextActive:{color:COLORS.primary},
  searchRow:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.white,marginHorizontal:12,marginVertical:8,paddingHorizontal:12,paddingVertical:8,borderRadius:10,borderWidth:1,borderColor:COLORS.gray200},
  searchInput:{flex:1,fontSize:14,color:COLORS.secondary},
  list:{padding:12,gap:10,paddingBottom:40},
  card:{backgroundColor:COLORS.white,borderRadius:12,padding:12,shadowColor:'#000',shadowOpacity:0.04,shadowRadius:4,elevation:2},
  dot:{width:10,height:10,borderRadius:5},
  empName:{fontSize:14,fontWeight:'700',color:COLORS.secondary},
  empSub:{fontSize:12,color:COLORS.gray500,marginTop:1},
  badge:{paddingHorizontal:10,paddingVertical:3,borderRadius:6},
  badgeText:{fontSize:11,fontWeight:'700',textTransform:'capitalize'},
  time:{fontSize:12,color:COLORS.gray500,fontWeight:'600'},
  regCard:{backgroundColor:COLORS.white,borderRadius:12,padding:14,shadowColor:'#000',shadowOpacity:0.05,shadowRadius:5,elevation:2},
  rejectBtn:{flex:1,paddingVertical:9,borderRadius:8,borderWidth:1.5,borderColor:COLORS.danger+'50',backgroundColor:COLORS.danger+'10',alignItems:'center'},
  rejectText:{fontSize:13,fontWeight:'700',color:COLORS.danger},
  approveBtn:{flex:1,paddingVertical:9,borderRadius:8,backgroundColor:COLORS.success,alignItems:'center'},
  approveText:{fontSize:13,fontWeight:'700',color:COLORS.white},
  empty:{alignItems:'center',paddingTop:60,gap:12},
  emptyText:{fontSize:14,color:COLORS.gray400},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24},
  modal:{backgroundColor:COLORS.white,borderRadius:20,padding:24,width:'100%'},
  modalTitle:{fontSize:17,fontWeight:'800',color:COLORS.secondary,marginBottom:12},
  modalInput:{borderWidth:1.5,borderColor:COLORS.gray200,borderRadius:10,padding:12,fontSize:14,color:COLORS.secondary,minHeight:70,textAlignVertical:'top',marginBottom:4},
  cancelBtn:{flex:1,paddingVertical:12,borderRadius:10,borderWidth:1.5,borderColor:COLORS.gray200,alignItems:'center'},
  cancelText:{fontSize:14,fontWeight:'700',color:COLORS.gray500},
  confirmBtn:{flex:1,paddingVertical:12,borderRadius:10,alignItems:'center'},
  confirmText:{fontSize:14,fontWeight:'700',color:COLORS.white},
});
