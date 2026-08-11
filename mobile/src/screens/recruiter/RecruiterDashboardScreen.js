import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { getInitials } from '../../utils/formatters';

const KpiCard = ({ label, value, color, icon }) => (
  <View style={[styles.kpiCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

export default function RecruiterDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ open_jobs: 0, applications: 0, interviews: 0, onboarding: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/recruitment/dashboard').catch(() => ({ data: {} }));
      const d = res.data?.data ?? res.data ?? {};
      setStats({
        open_jobs: Number(d.open_jobs || d.active_jobs || 0),
        applications: Number(d.total_applications || d.applications || 0),
        interviews: Number(d.scheduled_interviews || d.interviews || 0),
        onboarding: Number(d.onboarding_pending || d.onboarding || 0),
      });
    } catch (e) { console.log('recruiter dash', e?.message); }
  }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, [load]);

  const name = user?.full_name || user?.name || 'Recruiter';
  const quickActions = [
    { label: 'Jobs & Pipeline', icon: 'briefcase-outline', route: 'Recruitment', color: '#7c3aed' },
    { label: 'Onboarding', icon: 'person-add-outline', route: 'Onboarding', color: COLORS.primary },
    { label: 'People', icon: 'people-outline', route: 'People', color: COLORS.info },
    { label: 'Calendar', icon: 'calendar-outline', route: 'Calendar', color: '#8b5cf6' },
    { label: 'Documents', icon: 'document-text-outline', route: 'Documents', color: '#7c3aed' },
    { label: 'Reports', icon: 'bar-chart-outline', route: 'Reports', color: '#059669' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
        <LinearGradient colors={['#1a2535','#2d3748',COLORS.primary+'cc']} style={styles.banner}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(name)}</Text></View>
          <View style={{flex:1}}>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{user?.role_name||'Recruiter'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Recruitment Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
          <KpiCard label="Open Jobs" value={stats.open_jobs} color={COLORS.primary} icon="briefcase-outline" />
          <KpiCard label="Applications" value={stats.applications} color={COLORS.info} icon="people-outline" />
          <KpiCard label="Interviews" value={stats.interviews} color={COLORS.warning} icon="mic-outline" />
          <KpiCard label="Onboarding" value={stats.onboarding} color={COLORS.success} icon="person-add-outline" />
        </ScrollView>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {quickActions.map(a => (
            <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.route)}>
              <View style={[styles.actionIcon, { backgroundColor: a.color+'18' }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  banner:{flexDirection:'row',alignItems:'center',padding:20,gap:14},
  avatar:{width:50,height:50,borderRadius:25,backgroundColor:COLORS.primary,justifyContent:'center',alignItems:'center',borderWidth:2,borderColor:'rgba(255,255,255,0.3)'},
  avatarText:{fontSize:18,fontWeight:'900',color:COLORS.white},
  greeting:{fontSize:12,color:'rgba(255,255,255,0.6)'},
  name:{fontSize:16,fontWeight:'800',color:COLORS.white},
  role:{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:1},
  notifBtn:{width:40,height:40,borderRadius:20,backgroundColor:'rgba(255,255,255,0.15)',justifyContent:'center',alignItems:'center'},
  sectionTitle:{fontSize:13,fontWeight:'800',color:COLORS.gray500,textTransform:'uppercase',letterSpacing:0.8,marginHorizontal:16,marginTop:20,marginBottom:10},
  kpiRow:{paddingHorizontal:16,gap:10,paddingBottom:4},
  kpiCard:{width:90,backgroundColor:COLORS.white,borderRadius:12,padding:12,borderLeftWidth:3,alignItems:'center',gap:4,shadowColor:'#000',shadowOpacity:0.04,shadowRadius:4,elevation:2},
  kpiValue:{fontSize:22,fontWeight:'800'},
  kpiLabel:{fontSize:10,color:COLORS.gray500,fontWeight:'600',textAlign:'center'},
  grid:{flexDirection:'row',flexWrap:'wrap',paddingHorizontal:16,gap:10,paddingBottom:32},
  actionCard:{width:'30%',backgroundColor:COLORS.white,borderRadius:14,padding:14,alignItems:'center',gap:8,shadowColor:'#000',shadowOpacity:0.04,shadowRadius:4,elevation:2},
  actionIcon:{width:48,height:48,borderRadius:12,justifyContent:'center',alignItems:'center'},
  actionLabel:{fontSize:11,fontWeight:'700',color:COLORS.secondary,textAlign:'center'},
});
