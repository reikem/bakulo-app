import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Wind, 
  Zap, 
  Lightbulb, 
  User, 
  ChevronRight 
} from 'lucide-react-native';
import { ROUTES } from '@/constants/routes'; 

// Importación de tus componentes personalizados
import { NutritionCard, LifestyleItem, } from '@/components/ui/InsightComponents';

export default function InsightsScreen() {
  const router = useRouter();
  
  const [mealConfig, setMealConfig] = useState({
    tag: 'RECOMMENDED BREAKFAST',
    title: 'What to eat today',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setMealConfig({ tag: 'RECOMMENDED BREAKFAST', title: 'Balanced Morning Start', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' });
    } else if (hour >= 12 && hour < 18) {
      setMealConfig({ tag: 'RECOMMENDED LUNCH', title: 'Energizing Mid-day Meal', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd' });
    } else {
      setMealConfig({ tag: 'RECOMMENDED DINNER', title: 'Light & Stable Evening', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288' });
    }
  }, []);

  // FUNCIÓN DE NAVEGACIÓN CON DEBUG
  const handleNavigation = (routeName: string, source: string) => {
    console.log(`--- DEBUG NAVEGACIÓN ---`);
    console.log(`Origen: ${source}`);
    console.log(`Ruta destino solicitada: "${routeName}"`);
    
    if (!routeName) {
      console.error("ERROR: La ruta está indefinida. Revisa tu archivo ROUTES.");
      Alert.alert("Error", "La ruta no está definida en el objeto ROUTES.");
      return;
    }

    try {
      router.push(routeName as any);
      console.log("Resultado: Ejecutado router.push correctamente.");
    } catch (error) {
      console.error("ERROR AL NAVEGAR:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            console.log("Botón Back presionado");
            router.back();
          }} 
          style={styles.backBtn}
        >
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Insights</Text>
        
        <View style={styles.avatarMini}>
          <User color="#c4ebe0" size={18} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Insights for You</Text>
          <Text style={styles.heroSubtitle}>Personalized recommendations to maintain Equilibrium today.</Text>
        </View>

        {/* NUTRITION SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutrition Advice</Text>
          <TouchableOpacity 
            style={styles.seeAllBtn}
            onPress={() => handleNavigation(ROUTES.INSIGHTS.NUTRITION_LIST, "Botón See All")}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight color="#c4ebe0" size={16} />
          </TouchableOpacity>
        </View>

        {/* MAIN NUTRITION CARD */}
        <TouchableOpacity 
          activeOpacity={0.9}
          style={styles.mainCardClickable}
          onPress={() => handleNavigation(ROUTES.INSIGHTS.NUTRITION_LIST, "Tarjeta NutritionCard")}
        >
          <NutritionCard 
            isLarge 
            tag={mealConfig.tag}
            title={mealConfig.title}
            desc="Balanced mix tailored for your needs."
            imageUri={mealConfig.image}
          />
        </TouchableOpacity>

        {/* LIFESTYLE TIPS */}
        <Text style={styles.sectionTitle}>Lifestyle Tips</Text>
        <LifestyleItem title="Managing stress" desc="Cortisol levels affect blood sugar." icon={Wind} color="#c4ebe0" />
        <LifestyleItem title="Exercise timing" desc="Prevent nocturnal hypoglycemia." icon={Zap} color="#a4f4b7" />

        <View style={styles.tipBox}>
          <View style={styles.tipIcon}><Lightbulb color="#004e63" size={32} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Tip of the day</Text>
            <Text style={styles.tipText}>
  {"\"Walking for 10 min after a meal can reduce spikes by 20%.\""}
</Text>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  headerTitle: { color: '#c4ebe0', fontSize: 16, fontWeight: '700' },
  backBtn: { padding: 8, backgroundColor: '#1d2426', borderRadius: 12 },
  avatarMini: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#004e63', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#c4ebe0' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  heroSection: { marginVertical: 10, marginBottom: 24 },
  heroTitle: { color: '#c4ebe0', fontSize: 34, fontWeight: '800', lineHeight: 42 },
  heroSubtitle: { color: '#6f787d', fontSize: 15, marginTop: 8, lineHeight: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: 20 }, // Área aumentada para debug
  seeAllText: { color: '#c4ebe0', fontSize: 14, fontWeight: '600', marginRight: 4 },
  mainCardClickable: { borderRadius: 24, overflow: 'hidden', backgroundColor: '#1a2123' },
  tipBox: { backgroundColor: 'rgba(0,103,130,0.15)', borderRadius: 32, padding: 24, flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 32 },
  tipIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#c4ebe0', alignItems: 'center', justifyContent: 'center' },
  tipTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '800' },
  tipText: { color: '#bfc8cd', fontSize: 14, fontStyle: 'italic', lineHeight: 20, marginTop: 2 }
});