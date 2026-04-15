import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { BentoStat, NoteSection } from '@/components/ui/DetailComponents';

export default function MealDetails() {
  const router = useRouter();
  const { title, value, time } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Detalle de Registro</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <MoreVertical color="#c4ebe0" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Image Section */}
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1525351484163-7529414344d8' }} 
            style={styles.heroImage} 
          />
          <View style={styles.statusBadge}>
            <View style={styles.dot} />
            <Text style={styles.statusText}>COMPLETADO</Text>
          </View>
        </View>

        {/* Primary Info */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.labelCaps}>DESAYUNO</Text>
            <Text style={styles.mainTitle}>{title || "Avocado Toast"}</Text>
          </View>
          <View style={styles.timeLabel}>
            <Text style={styles.timeValue}>{time || "09:15"}</Text>
            <Text style={styles.timeAmPm}>AM</Text>
          </View>
        </View>

        {/* Bento Grid */}
        <View style={styles.grid}>
          <BentoStat label="Porción" value="1 rebanada" subValue="Grande" icon="food-apple" color="#c4ebe0" />
          <BentoStat label="Carbos" value={value || "42g"} subValue="Gramos" icon="leaf" color="#a9cec4" />
        </View>
        
        <View style={[styles.grid, { marginTop: 12 }]}>
          <BentoStat label="Proteína" value="12g" icon="arm-flex" color="#86d0ef" />
          <BentoStat label="Impacto" value="Bajo" icon="chart-line" color="#a4f4b7" />
        </View>

        <NoteSection note="Sin picos de azúcar después de comer." />

        <TouchableOpacity style={styles.mainActionBtn}>
          <Text style={styles.mainActionText}>Editar Registro</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { padding: 8, backgroundColor: '#1d2426', borderRadius: 100 },
  iconBtn: { padding: 8 },
  navTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 20 },
  imageWrapper: { height: 280, borderRadius: 32, overflow: 'hidden', marginBottom: 24 },
  heroImage: { width: '100%', height: '100%' },
  statusBadge: { position: 'absolute', bottom: 20, left: 20, backgroundColor: '#c4ebe0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00201a', marginRight: 6 },
  statusText: { color: '#00201a', fontSize: 10, fontWeight: '800' },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  labelCaps: { color: '#bfc8ca', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  mainTitle: { color: '#c4ebe0', fontSize: 32, fontWeight: '800' },
  timeLabel: { alignItems: 'flex-end' },
  timeValue: { color: '#c4ebe0', fontSize: 24, fontWeight: '700' },
  timeAmPm: { color: '#bfc8ca', fontSize: 12 },
  grid: { flexDirection: 'row', gap: 12 },
  mainActionBtn: { backgroundColor: '#004e63', padding: 20, borderRadius: 100, alignItems: 'center', marginTop: 30 },
  mainActionText: { color: 'white', fontWeight: '800', fontSize: 16 }
});