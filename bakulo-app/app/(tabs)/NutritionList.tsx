import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, LayoutGrid } from 'lucide-react-native';
import { ROUTES } from '@/constants/routes';

const ARTICLES = [
  { id: '1', tag: 'DIABETES MANAGEMENT', title: 'Low-Carb Breakfast Ideas', date: 'Oct 24, 2023', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' },
  { id: '2', tag: 'NUTRITION SCIENCE', title: 'Managing Sugar Levels', date: 'Sep 18, 2023', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd' },
];

export default function NutritionList() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Advice</Text>
        <LayoutGrid color="#c4ebe0" size={20} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heroTitle}>Nutrition Advice</Text>
        <Text style={styles.heroSub}>Curated clinical insights for your health journey.</Text>

        <View style={styles.list}>
          {ARTICLES.map((item) => (
   <TouchableOpacity 
   key={item.id} 
   style={styles.card}
   onPress={() => router.push(ROUTES.INSIGHTS.ARTICLE_DETAIL)} // <--- Cambia esto
>
              <Image source={{ uri: item.img }} style={styles.cardImg} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTag}>{item.tag}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { padding: 8, backgroundColor: '#1d2426', borderRadius: 12 },
  headerTitle: { color: '#c4ebe0', fontWeight: 'bold' },
  scroll: { padding: 24 },
  heroTitle: { color: '#c4ebe0', fontSize: 32, fontWeight: '800' },
  heroSub: { color: '#6f787d', fontSize: 16, marginTop: 8, marginBottom: 30 },
  list: { gap: 20 },
  card: { flexDirection: 'row', backgroundColor: '#1a2123', borderRadius: 20, padding: 12, gap: 15 },
  cardImg: { width: 90, height: 90, borderRadius: 12 },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTag: { color: '#c4ebe0', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  cardTitle: { color: 'white', fontSize: 17, fontWeight: '700', marginTop: 4 },
  cardDate: { color: '#40484a', fontSize: 11, marginTop: 8 }
});