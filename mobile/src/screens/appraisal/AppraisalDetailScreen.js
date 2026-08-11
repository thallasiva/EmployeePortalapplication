import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import client from '../../api/client';

const RATING_LABELS = { 1:'Needs Improvement', 2:'Below Average', 3:'Meets Expectations', 4:'Exceeds Expectations', 5:'Outstanding' };
const RATING_COLORS = { 1:COLORS.danger, 2:'#f59e0b', 3:COLORS.primary, 4:'#059669', 5:'#7c3aed' };

const RatingBar = ({ value, max = 5 }) => {
  const pct = (value / max) * 100;
  const color = RATING_COLORS[Math.round(value)] || COLORS.primary;
  return (
    <View style={styles.ratingBarWrap}>
      <View style={styles.ratingBg}>
        <View style={[styles.ratingFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.ratingNum, { color }]}>{value}/{max}</Text>
    </View>
  );
};

export default function AppraisalDetailScreen({ navigation, route }) {
  const { appraisalId } = route.params || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await client.get(`/appraisals/${appraisalId}`);
        setData(r.data?.data ?? r.data);
      } catch { setData(null); }
      finally { setLoading(false); }
    };
    if (appraisalId) load();
  }, [appraisalId]);

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!data) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Appraisal not found</Text></View>;

  const overallRating = data.overall_rating || data.rating || 0;
  const ratingLabel = RATING_LABELS[Math.round(overallRating)] || '';
  const ratingColor = RATING_COLORS[Math.round(overallRating)] || COLORS.primary;
  const goals = data.goals || data.kpis || [];
  const feedback = data.feedback || data.comments || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Appraisal Detail</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.cycleName}>{data.cycle_name || data.period || 'Performance Review'}</Text>
            <Text style={styles.cycleDate}>
              {data.start_date ? new Date(data.start_date).toLocaleDateString() : ''} –{' '}
              {data.end_date ? new Date(data.end_date).toLocaleDateString() : ''}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: data.status === 'completed' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
              <Text style={[styles.statusTxt, { color: data.status === 'completed' ? COLORS.success : COLORS.warning }]}>
                {(data.status || 'pending').replace(/_/g,' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.ratingCircle}>
            <Text style={[styles.ratingBig, { color: ratingColor }]}>{overallRating > 0 ? overallRating.toFixed(1) : '—'}</Text>
            <Text style={styles.ratingMax}>/ 5</Text>
          </View>
        </View>
        {overallRating > 0 && (
          <View style={[styles.ratingBanner, { backgroundColor: ratingColor + '15' }]}>
            <Ionicons name="ribbon-outline" size={18} color={ratingColor} />
            <Text style={[styles.ratingBannerTxt, { color: ratingColor }]}>{ratingLabel}</Text>
          </View>
        )}

        {/* Goals / KPIs */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goals & KPIs ({goals.length})</Text>
            {goals.map((g, i) => (
              <View key={i} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{g.title || g.name || `Goal ${i+1}`}</Text>
                  {g.weightage && <Text style={styles.goalWeight}>{g.weightage}%</Text>}
                </View>
                {g.description && <Text style={styles.goalDesc}>{g.description}</Text>}
                {(g.rating || g.score) > 0 && <RatingBar value={g.rating || g.score} />}
                {g.comments && <Text style={styles.goalComment}>{g.comments}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Feedback */}
        {feedback.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            {feedback.map((f, i) => (
              <View key={i} style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View style={styles.feedbackAvatar}>
                    <Text style={styles.feedbackAvatarTxt}>{(f.reviewer || f.from || 'R')[0].toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.feedbackBy}>{f.reviewer || f.from || 'Reviewer'}</Text>
                    <Text style={styles.feedbackType}>{f.type || f.role || ''}</Text>
                  </View>
                </View>
                {f.comment && <Text style={styles.feedbackTxt}>{f.comment}</Text>}
                {(f.rating || 0) > 0 && <RatingBar value={f.rating} />}
              </View>
            ))}
          </View>
        )}

        {/* Self Assessment */}
        {data.self_assessment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Self Assessment</Text>
            <View style={styles.assessmentCard}>
              <Text style={styles.assessmentTxt}>{data.self_assessment}</Text>
            </View>
          </View>
        )}

        {/* Manager Comments */}
        {data.manager_comments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manager Comments</Text>
            <View style={styles.assessmentCard}>
              <Text style={styles.assessmentTxt}>{data.manager_comments}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{flexDirection:'row',alignItems:'center',padding:16,gap:10,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.gray100},
  back:{padding:4},
  title:{fontSize:18,fontWeight:'800',color:COLORS.secondary},
  body:{padding:16,gap:16,paddingBottom:40},
  summaryCard:{backgroundColor:COLORS.white,borderRadius:14,padding:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  summaryLeft:{flex:1,gap:6},
  cycleName:{fontSize:16,fontWeight:'800',color:COLORS.secondary},
  cycleDate:{fontSize:12,color:COLORS.gray500},
  statusPill:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:4,borderRadius:20},
  statusTxt:{fontSize:10,fontWeight:'800',letterSpacing:0.5},
  ratingCircle:{alignItems:'center'},
  ratingBig:{fontSize:36,fontWeight:'900'},
  ratingMax:{fontSize:12,color:COLORS.gray400,marginTop:-4},
  ratingBanner:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:14,paddingVertical:10,borderRadius:10},
  ratingBannerTxt:{fontSize:14,fontWeight:'700'},
  section:{gap:8},
  sectionTitle:{fontSize:12,fontWeight:'800',color:COLORS.gray400,textTransform:'uppercase',letterSpacing:1},
  goalCard:{backgroundColor:COLORS.white,borderRadius:12,padding:14,gap:6},
  goalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  goalTitle:{fontSize:14,fontWeight:'700',color:COLORS.secondary,flex:1},
  goalWeight:{fontSize:13,fontWeight:'800',color:COLORS.primary},
  goalDesc:{fontSize:12,color:COLORS.gray500,lineHeight:18},
  goalComment:{fontSize:12,color:COLORS.gray500,fontStyle:'italic'},
  ratingBarWrap:{flexDirection:'row',alignItems:'center',gap:10},
  ratingBg:{flex:1,height:6,backgroundColor:COLORS.gray100,borderRadius:3,overflow:'hidden'},
  ratingFill:{height:'100%',borderRadius:3},
  ratingNum:{fontSize:12,fontWeight:'700',minWidth:30},
  feedbackCard:{backgroundColor:COLORS.white,borderRadius:12,padding:12,gap:8},
  feedbackHeader:{flexDirection:'row',gap:10,alignItems:'center'},
  feedbackAvatar:{width:36,height:36,borderRadius:18,backgroundColor:COLORS.primary+'20',justifyContent:'center',alignItems:'center'},
  feedbackAvatarTxt:{fontSize:14,fontWeight:'800',color:COLORS.primary},
  feedbackBy:{fontSize:13,fontWeight:'700',color:COLORS.secondary},
  feedbackType:{fontSize:11,color:COLORS.gray400},
  feedbackTxt:{fontSize:13,color:COLORS.gray600||COLORS.gray500,lineHeight:18},
  assessmentCard:{backgroundColor:COLORS.white,borderRadius:12,padding:14},
  assessmentTxt:{fontSize:14,color:COLORS.gray600||COLORS.gray500,lineHeight:22},
});
