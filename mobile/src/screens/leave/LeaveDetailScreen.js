import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const STATUS_STYLES = {
  pending:  { bg:'#fef9c3', color:'#854d0e', icon:'time-outline' },
  approved: { bg:'#dcfce7', color:'#166534', icon:'checkmark-circle-outline' },
  rejected: { bg:'#fee2e2', color:'#991b1b', icon:'close-circle-outline' },
  cancelled:{ bg:'#f3f4f6', color:'#6b7280', icon:'ban-outline' },
};

export default function LeaveDetailScreen({ navigation, route }) {
  const { leaveId, isManager } = route.params || {};
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await client.get(`/leaves/${leaveId}`);
        setLeave(r.data?.data ?? r.data);
      } catch { setLeave(null); }
      finally { setLoading(false); }
    };
    if (leaveId) load();
  }, [leaveId]);

  const cancelLeave = () => {
    Alert.alert('Cancel Leave','Cancel your leave request?', [
      { text:'No' },
      { text:'Cancel Leave', style:'destructive', onPress: async () => {
        setActing(true);
        try {
          await client.put(`/leaves/${leaveId}/cancel`);
          setLeave(p => ({ ...p, status:'cancelled' }));
        } catch { Alert.alert('Error','Could not cancel leave'); }
        finally { setActing(false); }
      }},
    ]);
  };

  const managerAction = (action) => {
    Alert.alert(action === 'approve' ? 'Approve Leave' : 'Reject Leave',
      `${action === 'approve' ? 'Approve' : 'Reject'} this leave request?`, [
      { text:'Cancel' },
      { text:action === 'approve' ? 'Approve' : 'Reject',
        style: action === 'reject' ? 'destructive' : 'default',
        onPress: async () => {
          setActing(true);
          try {
            await client.put(`/leaves/${leaveId}/${action}`);
            setLeave(p => ({ ...p, status: action === 'approve' ? 'approved' : 'rejected' }));
          } catch { Alert.alert('Error', `Could not ${action} leave`); }
          finally { setActing(false); }
        }},
    ]);
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!leave) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Leave not found</Text></View>;

  const s = STATUS_STYLES[leave.status] || STATUS_STYLES.pending;
  const days = leave.duration || leave.days_count || leave.number_of_days || 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Leave Request</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: s.bg }]}>
          <Ionicons name={s.icon} size={22} color={s.color} />
          <Text style={[styles.statusTxt, { color: s.color }]}>
            {(leave.status || 'pending').toUpperCase()}
          </Text>
        </View>

        {/* Employee (if manager view) */}
        {(leave.employee_name || leave.name) && (
          <View style={styles.empCard}>
            <View style={styles.empAvatar}>
              <Text style={styles.empAvatarTxt}>{(leave.employee_name || leave.name || '?')[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.empName}>{leave.employee_name || leave.name}</Text>
              <Text style={styles.empRole}>{leave.department || leave.designation || ''}</Text>
            </View>
          </View>
        )}

        {/* Leave Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Details</Text>
          <View style={styles.card}>
            <InfoRow label="Leave Type" value={leave.leave_type || leave.type || '—'} />
            <InfoRow label="From" value={leave.start_date ? new Date(leave.start_date).toLocaleDateString() : '—'} />
            <InfoRow label="To"   value={leave.end_date   ? new Date(leave.end_date).toLocaleDateString()   : '—'} />
            <InfoRow label="Duration" value={`${days} day${days !== 1 ? 's' : ''}`} highlight />
            <InfoRow label="Applied On" value={leave.created_at ? new Date(leave.created_at).toLocaleDateString() : '—'} />
            {leave.approved_by && <InfoRow label="Actioned By" value={leave.approved_by} />}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason</Text>
          <View style={styles.card}>
            <Text style={styles.reason}>{leave.reason || 'No reason provided'}</Text>
          </View>
        </View>

        {leave.rejection_reason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rejection Reason</Text>
            <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: COLORS.danger }]}>
              <Text style={styles.reason}>{leave.rejection_reason}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {isManager && leave.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => managerAction('reject')} disabled={acting}>
              <Ionicons name="close" size={18} color={COLORS.danger} />
              <Text style={styles.rejectTxt}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => managerAction('approve')} disabled={acting}>
              {acting ? <ActivityIndicator size="small" color={COLORS.white} />
                : <><Ionicons name="checkmark" size={18} color={COLORS.white} /><Text style={styles.approveTxt}>Approve</Text></>}
            </TouchableOpacity>
          </View>
        )}
        {!isManager && leave.status === 'pending' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelLeave} disabled={acting}>
            <Ionicons name="ban-outline" size={18} color={COLORS.danger} />
            <Text style={styles.cancelTxt}>Cancel Leave Request</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value, highlight }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && { color: COLORS.primary, fontWeight: '800' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{flexDirection:'row',alignItems:'center',padding:16,gap:10,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  back:{padding:4},
  title:{fontSize:18,fontWeight:'800',color:COLORS.secondary},
  body:{padding:16,gap:14,paddingBottom:40},
  statusBanner:{flexDirection:'row',alignItems:'center',gap:10,padding:14,borderRadius:12},
  statusTxt:{fontSize:15,fontWeight:'800'},
  empCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:COLORS.white,borderRadius:12,padding:12},
  empAvatar:{width:42,height:42,borderRadius:21,backgroundColor:COLORS.primary+'20',justifyContent:'center',alignItems:'center'},
  empAvatarTxt:{fontSize:18,fontWeight:'900',color:COLORS.primary},
  empName:{fontSize:14,fontWeight:'700',color:COLORS.secondary},
  empRole:{fontSize:12,color:COLORS.gray500},
  section:{gap:8},
  sectionTitle:{fontSize:12,fontWeight:'800',color:COLORS.gray400,textTransform:'uppercase',letterSpacing:1},
  card:{backgroundColor:COLORS.white,borderRadius:12,padding:14,gap:10},
  infoRow:{flexDirection:'row',justifyContent:'space-between'},
  infoLabel:{fontSize:13,color:COLORS.gray500},
  infoValue:{fontSize:13,fontWeight:'600',color:COLORS.secondary},
  reason:{fontSize:14,color:COLORS.gray600||COLORS.gray500,lineHeight:20},
  actions:{flexDirection:'row',gap:12},
  rejectBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:12,borderWidth:1.5,borderColor:COLORS.danger+'40',backgroundColor:COLORS.danger+'08'},
  rejectTxt:{fontSize:14,fontWeight:'700',color:COLORS.danger},
  approveBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:12,backgroundColor:COLORS.success},
  approveTxt:{fontSize:14,fontWeight:'700',color:COLORS.white},
  cancelBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:12,borderWidth:1.5,borderColor:COLORS.danger+'40',backgroundColor:COLORS.danger+'08'},
  cancelTxt:{fontSize:14,fontWeight:'700',color:COLORS.danger},
});
