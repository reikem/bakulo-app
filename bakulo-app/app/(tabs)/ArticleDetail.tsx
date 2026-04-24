import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, Share2, Bookmark } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ArticleDetail() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Hero Image with Back Button Overlay */}
      <View style={styles.heroContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd' }} 
          style={styles.heroImg} 
        />
        <LinearGradient colors={['rgba(23,29,30,0.8)', 'transparent']} style={styles.topOverlay} />
        
        <SafeAreaView style={styles.navOverlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn}>
            <Bookmark color="white" size={20} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.meta}>
          <View style={styles.tag}><Text style={styles.tagText}>DIABETES MANAGEMENT</Text></View>
          <View style={styles.time}><Clock color="#6f787d" size={14} /><Text style={styles.timeText}>5 min read</Text></View>
        </View>

        <Text style={styles.title}>Managing Sugar Levels: A Clinical Guide</Text>
        
        <Text style={styles.body}>
          Stabilizing blood glucose levels is a cornerstone of effective diabetes care. 
          The relationship between diet and insulin response is not just about avoiding sugar...
        </Text>

        <View style={styles.strategyBox}>
           <Text style={styles.strategyTitle}>Key Nutritional Strategies</Text>
           <Text style={styles.body}>• Increase fiber intake (25-30g daily)</Text>
           <Text style={styles.body}>• Prioritize lean proteins</Text>
           <Text style={styles.body}>• Consistent portion control</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn}>
          <Share2 color="white" size={20} />
          <Text style={styles.shareText}>Share with my Doctor</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  heroContainer: { height: 350, width: '100%' },
  heroImg: { ...StyleSheet.absoluteFillObject },
  topOverlay: { height: 100, width: '100%' },
  navOverlay: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
  circleBtn: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#171d1e', marginTop: -30, padding: 24 },
  meta: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  tag: { backgroundColor: '#004e63', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  tagText: { color: '#c4ebe0', fontSize: 10, fontWeight: 'bold' },
  time: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { color: '#6f787d', fontSize: 12 },
  title: { color: 'white', fontSize: 32, fontWeight: '800', marginBottom: 20 },
  body: { color: '#bfc8cd', fontSize: 16, lineHeight: 26, marginBottom: 20 },
  strategyBox: { backgroundColor: '#1d2426', padding: 20, borderRadius: 24, marginBottom: 30 },
  strategyTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '800', marginBottom: 15 },
  shareBtn: { backgroundColor: '#004e63', flexDirection: 'row', padding: 20, borderRadius: 100, justifyContent: 'center', alignItems: 'center', gap: 10 },
  shareText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});