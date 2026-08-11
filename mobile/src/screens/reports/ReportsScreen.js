import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { reportsApi } from '../../api/reports.api';

const REPORTS = [
  { id: 'attendance', label: 'Attendance Report', desc: 'Daily/monthly attendance summary', icon: 'finger-print-outline', color: COLORS.primary, apiMethod: 'attendance' },
  { id: 'leave', label: 'Leave Report', desc: 'Leave balance and utilization', icon: 'calendar-outline', color: '#7c3aed', apiMethod: 'leave' },
  { id: 'payroll', label: 'Payroll Report', desc: 'Salary disbursement details', icon: 'cash-outline', color: COLORS.success, apiMethod: 'payroll' },
  { id: 'employees', label: 'Employee Report', desc: 'Employee strength by department', icon: 'people-outline', color: COLORS.info, apiMethod: 'employees' },
  { id: 'helpdesk', label: 'Helpdesk Report', desc: 'Support tickets summary', icon: 'headset-outline', color: COLORS.warning, apiMethod: 'helpdesk' },
  { id: 'reviews', label: 'Performance Report', desc: 'Appraisal ratings summary', icon: 'ribbon-outline', color: '#db2777', apiMethod: 'reviews' },
  { id: 'hiring', label: 'Recruitment Report', desc: 'Hiring pipeline and stats', icon: 'briefcase-outline', color: '#059669', apiMethod: 'hiring' },
];

const FORMATS = ['PDF', 'Excel', 'CSV'];

export default function ReportsScreen({ navigation }) {
  const [downloading, setDownloading] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('PDF');

  const downloadReport = async (report) => {
    setDownloading(report.id);
    try {
      const res = await reportsApi[report.apiMethod]({ format: selectedFormat.toLowerCase(), month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      const url = res.data?.download_url || res.data?.url;
      if (url) { await Linking.openURL(url); }
      else { Alert.alert('Report Ready', `${report.label} generated. Check your email or downloads.`); }
    } catch { Alert.alert('Generating', 'Report will be emailed to you.'); }
    finally { setDownloading(null); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Format selector */}
        <View style={styles.formatRow}>
          <Text style={styles.formatLabel}>Format:</Text>
          {FORMATS.map(f => (
            <TouchableOpacity key={f} onPress={() => setSelectedFormat(f)} style={[styles.formatChip, selectedFormat === f && styles.formatChipActive]}>
              <Text style={[styles.formatText, selectedFormat === f && styles.formatTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Available Reports</Text>

        {REPORTS.map(report => (
          <View key={report.id} style={styles.reportCard}>
            <View style={[styles.reportIcon, { backgroundColor: report.color + '20' }]}>
              <Ionicons name={report.icon} size={22} color={report.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportLabel}>{report.label}</Text>
              <Text style={styles.reportDesc}>{report.desc}</Text>
            </View>
            <TouchableOpacity
              style={[styles.downloadBtn, downloading === report.id && { opacity: 0.7 }]}
              onPress={() => downloadReport(report)}
              disabled={!!downloading}
            >
              {downloading === report.id
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Ionicons name="download-outline" size={18} color={COLORS.white} />}
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>Reports are generated for the current month. For custom date ranges, use the web admin panel.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  formatRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 4 },
  formatLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
  formatChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  formatChipActive: { backgroundColor: COLORS.primary },
  formatText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  formatTextActive: { color: COLORS.white },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, marginTop: 4, marginBottom: 4 },
  reportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  reportIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reportLabel: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  reportDesc: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  downloadBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.info + '15', borderRadius: 12, padding: 14, marginTop: 8 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.info, lineHeight: 20 },
});
