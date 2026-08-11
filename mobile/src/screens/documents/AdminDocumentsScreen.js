import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  RefreshControl, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';
import { timeAgo } from '../../utils/formatters';
import * as DocumentPicker from 'expo-document-picker';

const unwrap = r => r.data?.data ?? r.data;
const CATS = ['All', 'Policy', 'Handbook', 'Letter', 'Form', 'Other'];

const ICONS = {
  pdf: 'document-text-outline',
  doc: 'document-outline', docx: 'document-outline',
  xls: 'grid-outline', xlsx: 'grid-outline',
  img: 'image-outline', default: 'document-outline',
};

function docIcon(name='') {
  const ext = (name.split('.').pop()||'').toLowerCase();
  return ICONS[ext] || ICONS.default;
}

export default function AdminDocumentsScreen({ navigation }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { limit: 200 };
      if (category !== 'All') params.category = category;
      const res = await client.get('/documents/admin', { params }).then(unwrap);
      const rows = Array.isArray(res) ? res : (res?.documents || res?.data || res?.rows || []);
      setDocs(rows);
    } catch {
      // fallback: try /documents
      try {
        const res2 = await client.get('/documents', { params: { limit: 200 } }).then(unwrap);
        const rows2 = Array.isArray(res2) ? res2 : (res2?.documents || res2?.data || res2?.rows || []);
        setDocs(rows2);
      } catch { setDocs([]); }
    }
  }, [category]);

  const fetch = async () => { setLoading(true); await load(); setLoading(false); };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { fetch(); }, [load]);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;
      setUploading(true);
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      formData.append('category', category !== 'All' ? category : 'Other');
      formData.append('title', file.name);
      await client.post('/documents/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Document uploaded');
      load();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await client.delete(`/documents/${id}`); load(); }
        catch { Alert.alert('Error', 'Delete failed'); }
      }},
    ]);
  };

  const filtered = docs.filter(d => {
    const title = (d.title || d.document_name || d.file_name || '').toLowerCase();
    return !search || title.includes(search.toLowerCase());
  });

  const renderDoc = ({ item }) => (
    <View style={styles.docCard}>
      <View style={[styles.docIcon, { backgroundColor: COLORS.primary + '15' }]}>
        <Ionicons name={docIcon(item.title || item.file_name || '')} size={24} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.docTitle} numberOfLines={1}>{item.title || item.document_name || item.file_name || 'Document'}</Text>
        <Text style={styles.docMeta}>{item.category || 'General'} · {timeAgo(item.created_at || item.uploaded_at)}</Text>
        {item.uploaded_by_name && <Text style={styles.docMeta}>By {item.uploaded_by_name}</Text>}
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.document_id || item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Documents</Text>
        <TouchableOpacity onPress={handleUpload} style={styles.uploadBtn} disabled={uploading}>
          {uploading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />}
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
        {CATS.map(c => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={COLORS.gray400} style={{ marginRight: 6 }} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search documents..." placeholderTextColor={COLORS.gray300} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => String(item.document_id || item.id || i)}
        renderItem={renderDoc}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={56} color={COLORS.gray300} />
              <Text style={styles.emptyTitle}>No documents</Text>
              <Text style={styles.emptyDesc}>Tap the upload button to add documents</Text>
            </View>
          )
        }
      />
      {loading && <ActivityIndicator color={COLORS.primary} style={{ position: 'absolute', top: '50%', alignSelf: 'center' }} />}

      <TouchableOpacity style={styles.fab} onPress={handleUpload} disabled={uploading}>
        {uploading ? <ActivityIndicator color={COLORS.white} /> : <Ionicons name="add" size={26} color={COLORS.white} />}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  back:{width:36,height:36,justifyContent:'center'},
  title:{fontSize:17,fontWeight:'700',color:COLORS.secondary},
  uploadBtn:{width:36,height:36,borderRadius:10,backgroundColor:COLORS.primary,justifyContent:'center',alignItems:'center'},
  catScroll:{maxHeight:48,backgroundColor:COLORS.white},
  catRow:{paddingHorizontal:12,paddingVertical:8,gap:8,flexDirection:'row'},
  chip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:COLORS.gray100},
  chipActive:{backgroundColor:COLORS.primary},
  chipText:{fontSize:13,fontWeight:'600',color:COLORS.gray500},
  chipTextActive:{color:COLORS.white},
  searchRow:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.white,marginHorizontal:12,marginVertical:8,paddingHorizontal:12,paddingVertical:8,borderRadius:10,borderWidth:1,borderColor:COLORS.gray200},
  searchInput:{flex:1,fontSize:14,color:COLORS.secondary},
  list:{padding:12,gap:10,paddingBottom:100},
  docCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:COLORS.white,borderRadius:12,padding:14,shadowColor:'#000',shadowOpacity:0.04,shadowRadius:4,elevation:2},
  docIcon:{width:44,height:44,borderRadius:10,justifyContent:'center',alignItems:'center'},
  docTitle:{fontSize:14,fontWeight:'700',color:COLORS.secondary},
  docMeta:{fontSize:11,color:COLORS.gray400,marginTop:2},
  deleteBtn:{width:36,height:36,justifyContent:'center',alignItems:'center'},
  empty:{alignItems:'center',paddingTop:80,gap:10},
  emptyTitle:{fontSize:16,fontWeight:'700',color:COLORS.gray500},
  emptyDesc:{fontSize:13,color:COLORS.gray400},
  fab:{position:'absolute',bottom:24,right:20,width:54,height:54,borderRadius:27,backgroundColor:COLORS.primary,justifyContent:'center',alignItems:'center',shadowColor:COLORS.primary,shadowOpacity:0.4,shadowRadius:8,elevation:6},
});
