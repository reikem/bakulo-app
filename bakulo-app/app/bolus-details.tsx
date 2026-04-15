import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { HeroDetailCard, BentoStat, NoteSection } from '@/components/ui/DetailComponents';

export default function BolusDetails() {
  const router = useRouter();
  const { value } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Registro de Insulina</Text>
        <TouchableOpacity style={styles.iconBtn}><MoreVertical color="#c4ebe0" size={24} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <HeroDetailCard 
          value={value || "6.5"} 
          unit="Unidades" 
          label="Humalog (Dosis Bolus)" 
          subtitle="Realizado 09:20 AM"
          color="#004e63"
          icon="needle"
        />

        <View style={styles.grid}>
          {/* Tarjeta de Zona de Inyección */}
          <View style={styles.tallCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>Zona de inyección</Text>
            </View>
            <Text style={styles.bentoValue}>Abdomen</Text>
            <View style={styles.bodyPlaceholder}>
               <Text style={{color: '#42655d', fontSize: 10}}>BODY MAP ACTIVE</Text>
            </View>
          </View>

          <View style={{ flex: 1, gap: 12 }}>
            <BentoStat label="Temp" value="4°C" icon="thermometer" color="#86d0ef" />
            <BentoStat label="Estado" value="Listo" icon="check-circle" color="#a4f4b7" />
          </View>
        </View>

        <NoteSection note="Dosis administrada antes del desayuno. No se reportaron anomalías." />
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
  scroll: { padding: 20 },
  grid: { flexDirection: 'row', gap: 12 },
  tallCard: { flex: 1.2, backgroundColor: '#1d2426', borderRadius: 24, padding: 20, justifyContent: 'space-between' },
  bentoHeader: { marginBottom: 4 },
  bentoLabel: { color: '#bfc8ca', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  bentoValue: { color: 'white', fontSize: 22, fontWeight: '700' },
  bodyPlaceholder: { height: 120, backgroundColor: '#171d1e', borderRadius: 16, marginTop: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }
});