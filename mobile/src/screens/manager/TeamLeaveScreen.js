import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { leaveApi } from '../../api/leave.api';
import { timeAgo } from '../../utils/formatters';

const STATUS_COLORS = { Pending: COLORS.warning, Approved: COLORS.success, Rejected: COLORS.danger };
const FILTERS = ['Pending', 'Approved', 'Rejected'];

export default function TeamLeaveScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Pending');
  const [reviewModal, setReviewModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await leaveApi.list({ status: filter, limit: 100 });
      const rows = Array.isArray(res) ? res : (res?.rows || res?.data || []);
      setRequests(rows);
    } catch { setRequests([]); }
  }, [filter]);

  const fetch = async () => { setLoading(true); await load(); setLoading(false); };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { fetch(); }, [load]);

  const handleReview = async (decision) => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await leaveApi.review(reviewModal.id, { decision, remarks });
      Alert.alert('Done', `Request ${decision}d.`);
      setReviewModal(null);
      load();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Action failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Team Leave</Text>
        <View style={{width:36}} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.chip, filter===f && styles.chipActive]}>
            <Text style={[styles.chipText, filter===f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={requests}
        keyExtractor={(item,i) => String(item.leave_request_id||item.id||i)}
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status] || COLORS.gray400;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{flex:1}}>
                  <Text style={styles.empName}>{item.employee_name||item.full_name||'Employee'}</Text>
                  <Text style={styles.empSub}>{item.leave_type_name||item.leave_type} · {item.no_of_days||1} day(s)</Text>
                </View>
                <View style={[styles.badge, {backgroundColor:sc+'20'}]}>
                  <Text style={[styles.badgeText, {color:sc}]}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.gray400} />
                <Text style={styles.dateText}>{item.from_date} → {item.to_date}</Text>
              </View>
              {item.reason && <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>}
              {item.status === 'Pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => { setReviewModal({id:item.leave_request_id||item.id, name:item.employee_name}); setRemarks(''); }}>
                    <Ionicons name="close-circle-outline" size={15} color={COLORS.danger} />
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.approveBtn} onPress={async () => {
                    setSubmitting(true);
                    try { await leaveApi.review(item.leave_request_id||item.id, { decision: 'approve', remarks: '' }); load(); }
                    catch { Alert.alert('Error','Action failed.'); }
                    finally { setSubmitting(false); }
                  }}>
                    <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.white} />
                    <Text style={styles.approveText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.ago}>{timeAgo(item.created_at)}</Text>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="calendar-outline" size={48} color={COLORS.gray300}/><Text style={styles.emptyText}>No {filter.toLowerCase()} requests</Text></View>}
      />

      {/* Reject Modal (needs remarks) */}
      <Modal visible={!!reviewModal} transparent animationType="fade" onRequestClose={() => setReviewModal(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Reject Leave</Text>
            <Text style={styles.modalSub}>{reviewModal?.name}</Text>
            <TextInput style={styles.modalInput} value={remarks} onChangeText={setRemarks} placeholder="Reason for rejection..." placeholderTextColor={COLORS.gray300} multiline textAlignVertical="top" />
            <View style={{flexDirection:'row',gap:10,marginTop:12}}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReviewModal(null)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn,{backgroundColor:COLORS.danger}]} onPress={() => handleReview('reject')} disabled={submitting}>
                {submitting ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.confirmText}>Reject</Text>}
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
  filterScroll:{maxHeight:48,backgroundColor:COLORS.white},
  filterRow:{paddingHorizontal:12,paddingVertical:8,gap:8,flexDirection:'row'},
  chip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:COLORS.gray100},
  chipActive:{backgroundColor:COLORS.primary},
  chipText:{fontSize:13,fontWeight:'600',color:COLORS.gray500},
  chipTextActive:{color:COLORS.white},
  list:{padding:12,gap:10,paddingBottom:40},
  card:{backgroundColor:COLORS.white,borderRadius:12,padding:14,shadowColor:'#000',shadowOpacity:0.05,shadowRadius:5,elevation:2},
  cardTop:{flexDirection:'row',alignItems:'center',marginBottom:8},
  empName:{fontSize:14,fontWeight:'700',color:COLORS.secondary},
  empSub:{fontSize:12,color:COLORS.gray500,marginTop:2},
  badge:{paddingHorizontal:10,paddingVertical:3,borderRadius:6},
  badgeText:{fontSize:11,fontWeight:'700'},
  dateRow:{flexDirection:'row',alignItems:'center',gap:5,marginBottom:4},
  dateText:{fontSize:12,color:COLORS.gray500},
  reason:{fontSize:13,color:COLORS.gray500,marginBottom:8},
  actions:{flexDirection:'row',gap:10,marginTop:10},
  rejectBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,paddingVertical:8,borderRadius:8,borderWidth:1.5,borderColor:COLORS.danger+'50',backgroundColor:COLORS.danger+'10'},
  rejectText:{fontSize:13,fontWeight:'700',color:COLORS.danger},
  approveBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,paddingVertical:8,borderRadius:8,backgroundColor:COLORS.success},
  approveText:{fontSize:13,fontWeight:'700',color:COLORS.white},
  ago:{fontSize:11,color:COLORS.gray400,marginTop:6,textAlign:'right'},
  empty:{alignItems:'center',paddingTop:60,gap:12},
  emptyText:{fontSize:14,color:COLORS.gray400},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24},
  modal:{backgroundColor:COLORS.white,borderRadius:20,padding:24,width:'100%'},
  modalTitle:{fontSize:17,fontWeight:'800',color:COLORS.secondary},
  modalSub:{fontSize:13,color:COLORS.gray500,marginBottom:12},
  modalInput:{borderWidth:1.5,borderColor:COLORS.gray200,borderRadius:10,padding:12,fontSize:14,color:COLORS.secondary,minHeight:80,marginBottom:4},
  cancelBtn:{flex:1,paddingVertical:12,borderRadius:10,borderWidth:1.5,borderColor:COLORS.gray200,alignItems:'center'},
  cancelText:{fontSize:14,fontWeight:'700',color:COLORS.gray500},
  confirmBtn:{flex:1,paddingVertical:12,borderRadius:10,alignItems:'center'},
  confirmText:{fontSize:14,fontWeight:'700',color:COLORS.white},
});
