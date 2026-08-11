import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const ACTION_COLORS = {
  create: '#059669', update: '#3b82f6', delete: '#ef4444',
  login: '#7c3aed', logout: '#6b7280', approve: '#10b981', reject: '#f59e0b',
};
const ACTION_ICONS = {
  create: 'add-circle-outline', update: 'pencil-outline', delete: 'trash-outline',
  login: 'log-in-outline', logout: 'log-out-outline', approve: 'checkmark-circle-outline', reject: 'close-circle-outline',
};

const LogItem = ({ item }) => {
  const action = (item.action || item.event_type || 'update').toLowerCase();
  const color = ACTION_COLORS[action] || COLORS.gray400;
  const icon = ACTION_ICONS[action] || 'information-circle-outline';

  return (
    <View style={styles.logRow}>
      <View style={[styles.logIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.logTop}>
          <Text style={styles.logAction}>{item.action || item.event_type || '—'}</Text>
          <Text style={styles.logTime}>{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</Text>
        </View>
        <Text style={styles.logDesc} numberOfLines={2}>{item.description || item.message || item.details || '—'}</Text>
        <View style={styles.logMeta}>
          <Text style={styles.logUser}>{item.performed_by || item.user || item.actor || 'System'}</Text>
          {item.module && <Text style={styles.logModule}>{item.module}</Text>}
          {item.ip_address && <Text style={styles.logIp}>{item.ip_address}</Text>}
        </View>
      </View>
    </View>
  );
};

const MODULES = ['All', 'Employee', 'Payroll', 'Leave', 'Attendance', 'Recruitment', 'Settings'];

export default function AuditLogsScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    try {
      const r = await client.get('/audit-logs', {
        params: { page: currentPage, limit: 30, module: module !== 'All' ? module.toLowerCase() : undefined, search: search || undefined },
      });
      const list = r.data?.data ?? r.data ?? [];
      const arr = Array.isArray(list) ? list : list.logs || [];
      if (reset) { setLogs(arr); setPage(2); }
      else { setLogs(p => [...p, ...arr]); setPage(p => p + 1); }
      setHasMore(arr.length === 30);
    } catch { if (reset) setLogs([]); }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, [module, search, page]);

  useEffect(() => { setLoading(true); setPage(1); load(true); }, [module]);

  const onRefresh = () => { setRefreshing(true); setPage(1); load(true); };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    load(false);
  };

  const filtered = search
    ? logs.filter(l => JSON.stringify(l).toLowerCase().includes(search.toLowerCase()))
    : logs;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Audit Logs</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={COLORS.gray400} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Search logs..." placeholderTextColor={COLORS.gray400} />
      </View>

      <View style={styles.modulesWrap}>
        <FlatList
          horizontal data={MODULES} keyExtractor={m => m}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item: m }) => (
            <TouchableOpacity onPress={() => setModule(m)}
              style={[styles.moduleChip, m === module && styles.moduleChipActive]}>
              <Text style={[styles.moduleChipTxt, m === module && styles.moduleChipTxtActive]}>{m}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <LogItem item={item} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} style={{ padding: 12 }} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.gray300} />
              <Text style={styles.emptyTxt}>No audit logs found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{flexDirection:'row',alignItems:'center',padding:16,gap:10,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  back:{padding:4},
  title:{fontSize:18,fontWeight:'800',color:COLORS.secondary},
  searchWrap:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.white,margin:12,marginBottom:8,borderRadius:10,paddingHorizontal:12,paddingVertical:8,gap:8,borderWidth:1,borderColor:COLORS.gray100},
  searchInput:{flex:1,fontSize:14,color:COLORS.secondary},
  modulesWrap:{paddingVertical:8},
  moduleChip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:COLORS.white,borderWidth:1.5,borderColor:COLORS.gray100},
  moduleChipActive:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},
  moduleChipTxt:{fontSize:12,fontWeight:'600',color:COLORS.gray500},
  moduleChipTxtActive:{color:COLORS.white},
  logRow:{flexDirection:'row',gap:12,paddingHorizontal:16,paddingVertical:12,backgroundColor:COLORS.white},
  logIcon:{width:36,height:36,borderRadius:10,justifyContent:'center',alignItems:'center',flexShrink:0},
  logTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  logAction:{fontSize:13,fontWeight:'700',color:COLORS.secondary,textTransform:'capitalize'},
  logTime:{fontSize:10,color:COLORS.gray400},
  logDesc:{fontSize:12,color:COLORS.gray500,marginVertical:3,lineHeight:17},
  logMeta:{flexDirection:'row',gap:10,flexWrap:'wrap'},
  logUser:{fontSize:11,fontWeight:'600',color:COLORS.primary},
  logModule:{fontSize:11,color:COLORS.gray400},
  logIp:{fontSize:11,color:COLORS.gray400},
  separator:{height:1,backgroundColor:COLORS.gray100},
  empty:{alignItems:'center',marginTop:60,gap:12},
  emptyTxt:{fontSize:15,color:COLORS.gray400},
});
