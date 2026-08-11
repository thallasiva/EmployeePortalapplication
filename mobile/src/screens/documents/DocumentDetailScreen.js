import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const FILE_ICONS = { pdf: 'document-text', doc: 'document', docx: 'document', jpg: 'image', jpeg: 'image', png: 'image', xls: 'grid', xlsx: 'grid' };
const FILE_COLORS = { pdf: '#ef4444', doc: '#3b82f6', docx: '#3b82f6', jpg: '#10b981', jpeg: '#10b981', png: '#10b981', xls: '#059669', xlsx: '#059669' };

export default function DocumentDetailScreen({ navigation, route }) {
  const { documentId } = route.params || {};
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await client.get(`/documents/${documentId}`);
        setDoc(r.data?.data ?? r.data);
      } catch { setDoc(null); }
      finally { setLoading(false); }
    };
    if (documentId) load();
  }, [documentId]);

  const openFile = async () => {
    if (!doc?.file_url && !doc?.url) { Alert.alert('No file', 'Document file not available'); return; }
    const url = doc.file_url || doc.url;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Error', 'Cannot open this file');
    } catch { Alert.alert('Error', 'Failed to open file'); }
  };

  const download = () => {
    Alert.alert('Download', 'The file will open in your browser for download.', [
      { text: 'Cancel' },
      { text: 'Open', onPress: openFile },
    ]);
  };

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!doc) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><Text>Document not found</Text></View>;

  const ext = (doc.file_name || doc.name || '').split('.').pop()?.toLowerCase() || 'doc';
  const icon = FILE_ICONS[ext] || 'document';
  const iconColor = FILE_COLORS[ext] || COLORS.primary;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{doc.title || doc.name || 'Document'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.docCard}>
          <View style={[styles.docIcon, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={`${icon}-outline`} size={40} color={iconColor} />
          </View>
          <Text style={styles.docTitle}>{doc.title || doc.name}</Text>
          <Text style={styles.docType}>{(ext || 'Document').toUpperCase()} File</Text>
          <View style={styles.docMeta}>
            <MetaItem icon="calendar-outline" label="Added" value={doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'} />
            <MetaItem icon="person-outline" label="By" value={doc.uploaded_by || doc.created_by || 'HR'} />
            {doc.file_size && <MetaItem icon="cloud-outline" label="Size" value={doc.file_size} />}
            {doc.category && <MetaItem icon="folder-outline" label="Category" value={doc.category} />}
          </View>
        </View>

        {doc.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descCard}>
              <Text style={styles.descTxt}>{doc.description}</Text>
            </View>
          </View>
        )}

        {doc.tags && doc.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {doc.tags.map((t, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagTxt}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.viewBtn} onPress={openFile}>
            <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
            <Text style={styles.viewTxt}>View Document</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadBtn} onPress={download}>
            <Ionicons name="download-outline" size={20} color={COLORS.white} />
            <Text style={styles.downloadTxt}>Download</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const MetaItem = ({ icon, label, value }) => (
  <View style={styles.metaItem}>
    <Ionicons name={icon} size={14} color={COLORS.gray400} />
    <Text style={styles.metaLabel}>{label}:</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: COLORS.secondary },
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  docCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 20, alignItems: 'center', gap: 10 },
  docIcon: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  docTitle: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, textAlign: 'center' },
  docType: { fontSize: 12, color: COLORS.gray500, fontWeight: '600' },
  docMeta: { width: '100%', gap: 6, borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaLabel: { fontSize: 12, color: COLORS.gray500 },
  metaValue: { fontSize: 12, fontWeight: '600', color: COLORS.secondary },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1 },
  descCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14 },
  descTxt: { fontSize: 14, color: COLORS.gray600 || COLORS.gray500, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: COLORS.primary + '12', borderRadius: 20 },
  tagTxt: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  actions: { flexDirection: 'row', gap: 12 },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary + '12', borderWidth: 1.5, borderColor: COLORS.primary + '30' },
  viewTxt: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  downloadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary },
  downloadTxt: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
