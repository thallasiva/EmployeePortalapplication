import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { documentsApi } from '../../api/documents.api';
import { timeAgo } from '../../utils/formatters';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'folder-outline' },
  { id: 'offer', label: 'Offer & Appointment', icon: 'document-text-outline' },
  { id: 'payroll', label: 'Payroll', icon: 'receipt-outline' },
  { id: 'leave', label: 'Leave', icon: 'calendar-outline' },
  { id: 'compliance', label: 'Compliance', icon: 'shield-checkmark-outline' },
  { id: 'personal', label: 'Personal', icon: 'person-outline' },
];

const EXT_ICONS = { pdf: 'document-text', doc: 'document', docx: 'document', xls: 'grid', xlsx: 'grid', jpg: 'image', png: 'image', jpeg: 'image' };
const EXT_COLORS = { pdf: COLORS.danger, doc: COLORS.info, docx: COLORS.info, xls: COLORS.success, xlsx: COLORS.success, jpg: '#7c3aed', png: '#7c3aed' };

export default function DocumentsScreen({ navigation }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentsApi.myDocs({ category: selectedCat === 'all' ? undefined : selectedCat });
      setDocs(Array.isArray(res) ? res : (res?.documents || res?.items || []));
    } catch { setDocs([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, [selectedCat]);

  const getExt = (filename) => (filename || '').split('.').pop().toLowerCase();

  const openDocument = async (doc) => {
    if (doc.url || doc.file_url) {
      try { await Linking.openURL(doc.url || doc.file_url); }
      catch { Alert.alert('Error', 'Cannot open file.'); }
    }
  };

  const renderDoc = ({ item }) => {
    const ext = getExt(item.filename || item.file_name || item.name);
    const iconName = EXT_ICONS[ext] || 'document-outline';
    const color = EXT_COLORS[ext] || COLORS.gray400;
    return (
      <TouchableOpacity style={styles.docCard} onPress={() => navigation.navigate('DocumentDetail', { documentId: item.id || item.document_id, document: item })}>
        <View style={[styles.docIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={iconName} size={24} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.docName} numberOfLines={1}>{item.filename || item.file_name || item.name || item.document_name}</Text>
          <Text style={styles.docMeta}>{item.category} · {timeAgo(item.created_at || item.uploaded_at)}</Text>
          {item.file_size && <Text style={styles.docSize}>{(item.file_size / 1024).toFixed(0)} KB</Text>}
        </View>
        <View style={styles.docActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openDocument(item)}>
            <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="download-outline" size={18} color={COLORS.gray400} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.secondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Documents</Text>
        <Text style={styles.count}>{docs.length}</Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContainer}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c.id} onPress={() => setSelectedCat(c.id)} style={[styles.catChip, selectedCat === c.id && styles.catChipActive]}>
            <Ionicons name={c.icon} size={14} color={selectedCat === c.id ? COLORS.white : COLORS.gray500} />
            <Text style={[styles.catText, selectedCat === c.id && styles.catTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={docs}
        keyExtractor={item => String(item.id)}
        renderItem={renderDoc}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDocuments} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={56} color={COLORS.gray300} />
            <Text style={styles.emptyTitle}>No Documents</Text>
            <Text style={styles.emptyText}>Documents shared with you will appear here.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  count: { fontSize: 13, color: COLORS.gray400, fontWeight: '600' },
  catScroll: { backgroundColor: COLORS.white, maxHeight: 54, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  catContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  catChipActive: { backgroundColor: COLORS.primary },
  catText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
  catTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 10 },
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  docIcon: { width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  docName: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  docMeta: { fontSize: 12, color: COLORS.gray400, marginTop: 3 },
  docSize: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  docActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  emptyText: { fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
});
