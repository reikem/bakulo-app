import React from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Wind, Zap, Lightbulb } from 'lucide-react-native';
import { NutritionCard, LifestyleItem, ProductCard } from '@/components/ui/InsightComponents';

export default function InsightsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <View style={styles.avatarMini} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          {/* CORRECCIÓN: Usamos <Text> en lugar de <h1> */}
          <Text style={styles.heroTitle}>Insights for You</Text>
          <Text style={styles.heroSubtitle}>Personalized recommendations to maintain Equilibrium today.</Text>
        </View>

        {/* NUTRITION BENTO */}
        <Text style={styles.sectionTitle}>Nutrition Advice</Text>
        <NutritionCard 
          isLarge 
          tag="RECOMMENDED BREAKFAST"
          title="What to eat today"
          desc="Balanced mix of complex carbs and high protein."
          imageUri="https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
        />

        {/* LIFESTYLE TIPS */}
        <Text style={styles.sectionTitle}>Lifestyle Tips</Text>
        <LifestyleItem 
          title="Managing stress"
          desc="Cortisol levels affect blood sugar. Try 5-min breathing."
          icon={Wind}
          color="#c4ebe0"
        />
        <LifestyleItem 
          title="Exercise timing"
          desc="Best for cardio to prevent nocturnal hypoglycemia."
          icon={Zap}
          color="#a4f4b7"
        />

        {/* PRODUCTS HORIZONTAL */}
        <Text style={styles.sectionTitle}>Safe Essentials</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <ProductCard name="Keto Bars" price="12.99" category="SNACK" desc="0g added sugar" />
          <ProductCard name="Glucose Tabs" price="8.50" category="EMERGENCY" desc="Orange, 15g carbs" />
          <ProductCard name="CGM Patches" price="24.00" category="LIFESTYLE" desc="Waterproof" />
        </ScrollView>

        {/* TIP OF THE DAY */}
        <View style={styles.tipBox}>
          <View style={styles.tipIcon}>
            <Lightbulb color="#004e63" size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Tip of the day</Text>
            <Text style={styles.tipText}>"Walking for 10 min after a meal can reduce spikes by 20%."</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#c4ebe0', fontSize: 16, fontWeight: '700' },
  backBtn: { padding: 8 },
  avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#004e63', borderWidth: 1, borderColor: '#c4ebe0' },
  scroll: { paddingHorizontal: 24, paddingBottom: 100 },
  hero: { marginBottom: 32, marginTop: 10 },
  // Estilo que simula un H1
  heroTitle: { color: '#c4ebe0', fontSize: 34, fontWeight: '800' },
  heroSubtitle: { color: '#6f787d', fontSize: 15, marginTop: 8, lineHeight: 22 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 16, marginTop: 24 },
  horizontalScroll: { marginHorizontal: -24, paddingLeft: 24 },
  tipBox: { backgroundColor: 'rgba(0,103,130,0.15)', borderRadius: 32, padding: 24, flexDirection: 'row', gap: 20, alignItems: 'center', marginTop: 32 },
  tipIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#c4ebe0', alignItems: 'center', justifyContent: 'center' },
  tipTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  tipText: { color: '#bfc8cd', fontSize: 14, fontStyle: 'italic', lineHeight: 20 }
});