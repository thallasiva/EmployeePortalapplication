import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const STATUS_COLORS = { open: '#f59e0b', 'in-progress': '#3b82f6', resolved: '#10b981', closed: '#6b7280' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };

export default function TicketDetailScreen({ navigation, route }) {
  const { ticketId } = route.params || {};
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, c] = await Promise.all([
          client.get(`/helpdesk/tickets/${ticketId}`).then(r => r.data?.data ?? r.data),
          client.get(`/helpdesk/tickets/${ticketId}/comments`).then(r => r.data?.data ?? r.data ?? []),
        ]);
        setTicket(t);
        setComments(Array.isArray(c) ? c : []);
      } catch { setTicket(null); }
      finally { setLoading(false); }
    };
    if (ticketId) load();
  }, [ticketId]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await client.post(`/helpdesk/tickets/${ticketId}/comments`, { content: comment });
      const c = await client.get(`/helpdesk/tickets/${ticketId}/comments`).then(r => r.data?.data ?? r.data ?? []);
      setComments(Array.isArray(c) ? c : []);
      setComment('');
    } catch { Alert.alert('Error', 'Could not send comment'); }
    finally { setSending(false); }
  };

  const closeTicket = () => {
    Alert.alert('Close Ticket', 'Mark this ticket as resolved?', [
      { text: 'Cancel' },
      { text: 'Close', style: 'destructive', onPress: async () => {
        try {
          await client.put(`/helpdesk/tickets/${ticketId}`, { status: 'resolved' });
          navigation.goBack();
        } catch { Alert.alert('Error', 'Could not close ticket'); }
      }},
    ]);
  };

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const statusColor = STATUS_COLORS[ticket?.status] || '#6b7280';
  const priorityColor = PRIORITY_COLORS[ticket?.priority] || '#6b7280';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Ticket #{ticketId}</Text>
        {ticket?.status !== 'resolved' && ticket?.status !== 'closed' && (
          <TouchableOpacity onPress={closeTicket} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>Close</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body}>
          {ticket && (
            <View style={styles.ticketCard}>
              <Text style={styles.subject}>{ticket.subject || ticket.title || '—'}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.tag, { backgroundColor: statusColor + '20' }]}>
                  <View style={[styles.dot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.tagTxt, { color: statusColor }]}>{ticket.status}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: priorityColor + '20' }]}>
                  <Text style={[styles.tagTxt, { color: priorityColor }]}>{ticket.priority || 'normal'}</Text>
                </View>
                <Text style={styles.category}>{ticket.category || ''}</Text>
              </View>
              <Text style={styles.desc}>{ticket.description || ticket.content || '—'}</Text>
              <View style={styles.divider} />
              <View style={styles.infoGrid}>
                <InfoItem label="Raised By" value={ticket.raised_by || ticket.employee_name || 'Me'} />
                <InfoItem label="Assigned To" value={ticket.assigned_to || ticket.assignee || 'Unassigned'} />
                <InfoItem label="Created" value={ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '—'} />
                <InfoItem label="Updated" value={ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : '—'} />
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
          {comments.map((c, i) => (
            <View key={i} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarTxt}>{(c.author || c.name || 'U')[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.commentAuthor}>{c.author || c.name || 'User'}</Text>
                  <Text style={styles.commentTime}>{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</Text>
                </View>
              </View>
              <Text style={styles.commentBody}>{c.content || c.message || ''}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment..."
            placeholderTextColor={COLORS.gray400}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendComment} disabled={sending}>
            {sending ? <ActivityIndicator size="small" color={COLORS.white} /> : <Ionicons name="send" size={18} color={COLORS.white} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const InfoItem = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: COLORS.secondary },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.success + '15', borderRadius: 8 },
  closeTxt: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  body: { padding: 16, gap: 14, paddingBottom: 8 },
  ticketCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  subject: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tagTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  category: { fontSize: 11, color: COLORS.gray400, alignSelf: 'center' },
  desc: { fontSize: 14, color: COLORS.gray600 || COLORS.gray500, lineHeight: 20 },
  divider: { height: 1, backgroundColor: COLORS.gray100 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { width: '45%' },
  infoLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.secondary, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.8 },
  commentCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 12, gap: 8 },
  commentHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  commentAvatarTxt: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  commentTime: { fontSize: 11, color: COLORS.gray400 },
  commentBody: { fontSize: 13, color: COLORS.gray600 || COLORS.gray500, lineHeight: 18 },
  inputRow: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  commentInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: COLORS.secondary, maxHeight: 80 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
});
