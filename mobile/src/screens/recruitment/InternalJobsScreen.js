import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;

export default function InternalJobsScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    client.get('/recruitment/jobs', { params: { is_internal: true, status: 'open' } }).then(unwrap)
      .then(res => setJobs(Array.isArray(res) ? res : (res?.rows || res?.jobs || [])))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j =>
    (j.title || j.job_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (j.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const apply = (job) => {
    Alert.alert('Apply for ' + (job.title || job.job_title),
      'Submit your application for this internal position?',
      [{ text: 'Cancel', style: 'cancel' },
       { text: 'Apply', onPress: async () => {
          try {
            await client.post(`/recruitment/jobs/${job.id}/apply`, { is_internal: true });
            Alert.alert('Applied!', 'Your application has been submitted. HR will review it.');
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to apply');
          }
       }}]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.jobIcon}>
          <Ionicons name="briefcase-outline" size={20} color="#7c3aed" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle}>{item.title || item.job_title}</Text>
          <Text style={styles.jobDept}>{item.department} • {item.location || 'Office'}</Text>
        </View>
        <View style={styles.newBadge}><Text style={styles.newBadgeText}>Internal</Text></View>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={COLORS.gray400} />
          <Text style={styles.metaText}>{item.vacancies || item.openings || 1} Opening{(item.vacancies || 1) > 1 ? 's' : ''}</Text>
        </View>
        {item.experience && (
          <View style={styles.metaItem}>
            <Ionicons name="school-outline" size={14} color={COLORS.gray400} />
            <Text style={styles.metaText}>{item.experience}</Text>
          </View>
        )}
        {item.salary_range && (
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={COLORS.gray400} />
            <Text style={styles.metaText}>{item.salary_range}</Text>
          </View>
        )}
      </View>
      {item.description && <Text style={styles.jobDesc} numberOfLines={2}>{item.description}</Text>}
      <TouchableOpacity onPress={() => apply(item)} style={styles.applyBtn}>
        <Text style={styles.applyText}>Apply Now</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Internal Jobs</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray400} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Search jobs or departments..." placeholderTextColor={COLORS.gray300} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={filtered} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="briefcase-outline" size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No internal jobs available</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, paddingTop: 60, gap: 8 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  jobIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#7c3aed15', justifyContent: 'center', alignItems: 'center' },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  jobDept: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  newBadge: { backgroundColor: '#7c3aed20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  newBadgeText: { fontSize: 10, fontWeight: '800', color: '#7c3aed' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.gray500 },
  jobDesc: { fontSize: 13, color: COLORS.gray500, lineHeight: 18 },
  applyBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  applyText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  emptyText: { fontSize: 15, color: COLORS.gray400, textAlign: 'center' },
});
