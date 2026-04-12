import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Settings, 
  CloudCheck, 
  History, 
  BatteryFull, 
  Activity, 
  ShieldPlus, 
  RefreshCw 
} from 'lucide-react-native';

/**
 * IMPORTANTE: Asegúrate de que la ruta de importación sea la correcta 
 * según la ubicación de tu archivo HealthComponents.tsx
 */
import { StatusBadge, BentoCard } from '@/components/ui/HealthComponents';

export default function SyncScreen() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  // Lógica funcional para simular la sincronización
  const handleResync = () => {
    setIsSyncing(true);
    // Simulamos una latencia de red de 2 segundos
    setTimeout(() => {
      setIsSyncing(false);
      Alert.alert(
        "Sincronización Exitosa", 
        "Los datos de tus dispositivos médicos han sido actualizados correctamente."
      );
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Configuración de navegación de Expo Router */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER DINÁMICO */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft color="#c4ebe0" size={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Clinical Serenity</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Settings color="#bfc8ca" size={24} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* SECCIÓN HERO: ESTADO GLOBAL */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Sync Health</Text>
          <Text style={styles.heroSubtitle}>All systems are currently operational.</Text>
          
          <View style={styles.bentoGrid}>
            {/* Tarjeta de Integridad de Datos (Principal) */}
            <BentoCard style={styles.mainStatusCard}>
              <View style={styles.cardHeader}>
                <StatusBadge label="LIVE CONNECTION" color="#c4ebe0" textColor="#00201a" />
                <CloudCheck color="white" size={28} />
              </View>
              <Text style={styles.percentageText}>98%</Text>
              <Text style={styles.cardInfo}>Overall data integrity across 3 devices</Text>
              {/* Elemento decorativo visual */}
              <View style={styles.decorationCircle} />
            </BentoCard>

            {/* Sub-tarjetas informativas */}
            <View style={styles.row}>
              <BentoCard style={styles.smallCard}>
                <History color="#006782" size={22} />
                <View>
                  <Text style={styles.smallCardLabel}>Last Full Sync</Text>
                  <Text style={styles.smallCardValue}>2m ago</Text>
                </View>
              </BentoCard>
              <BentoCard style={styles.smallCard}>
                <BatteryFull color="#005229" size={22} />
                <View>
                  <Text style={styles.smallCardLabel}>System Power</Text>
                  <Text style={styles.smallCardValue}>Optimal</Text>
                </View>
              </BentoCard>
            </View>
          </View>
        </View>

        {/* GESTIÓN DE DISPOSITIVOS CONECTADOS */}
        <View style={styles.devicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Connected Devices</Text>
            <TouchableOpacity>
              <Text style={styles.manageBtn}>Manage</Text>
            </TouchableOpacity>
          </View>

          {/* Tarjeta Dispositivo: CGM Guardian Connect */}
          <BentoCard style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <View style={[styles.deviceIconBox, { backgroundColor: '#004e63' }]}>
                <Activity color="#a9cec4" size={28} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>Guardian Connect</Text>
                <View style={styles.signalContainer}>
                  {[1, 1, 1, 0].map((v, i) => (
                    <View key={i} style={[styles.signalBar, { backgroundColor: v ? '#006782' : '#3f484c' }]} />
                  ))}
                </View>
              </View>
              <View style={styles.batteryInfo}>
                <Text style={styles.batteryValue}>82%</Text>
                <Text style={styles.batteryLabel}>BATTERY</Text>
              </View>
            </View>
            <View style={styles.statusFooter}>
              <View style={styles.statusRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusText}>Transmitting data...</Text>
              </View>
              <Text style={styles.activeText}>Active</Text>
            </View>
          </BentoCard>

          {/* Tarjeta Dispositivo: Insulin Pump Omnipod 5 */}
          <BentoCard style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <View style={[styles.deviceIconBox, { backgroundColor: '#1a6c3c' }]}>
                <ShieldPlus color="#a4f4b7" size={28} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>Omnipod 5</Text>
                <View style={styles.signalContainer}>
                  {[1, 1, 1, 1].map((v, i) => (
                    <View key={i} style={[styles.signalBar, { backgroundColor: '#006782' }]} />
                  ))}
                </View>
              </View>
              <View style={styles.batteryInfo}>
                <Text style={styles.batteryValue}>45%</Text>
                <Text style={styles.batteryLabel}>BATTERY</Text>
              </View>
            </View>
            <View style={styles.statusFooter}>
              <Text style={styles.statusTextInactive}>Standby Mode</Text>
              <Text style={styles.linkedText}>Linked</Text>
            </View>
          </BentoCard>
        </View>

        {/* ACCIÓN: FORZAR SINCRONIZACIÓN */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
            onPress={handleResync}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <RefreshCw color="white" size={22} />
                <Text style={styles.syncButtonText}>Force Manual Re-sync</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.syncNote}>
            Use this if data seems delayed by more than 5 minutes.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal (Fondo oscuro)
  container: { flex: 1, backgroundColor: '#171d1e' },
  
  // Header y Navegación
  headerContainer: { backgroundColor: '#1d2426' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 12 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { backgroundColor: 'rgba(0,103,130,0.2)', padding: 8, borderRadius: 12 },
  headerTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '800' },
  iconButton: { padding: 8 },
  
  // Contenido con Scroll
  scrollContent: { padding: 24, paddingBottom: 120 },
  
  // Hero Section
  heroSection: { marginBottom: 32 },
  heroTitle: { color: '#baeaff', fontSize: 32, fontWeight: '800', marginBottom: 4 },
  heroSubtitle: { color: '#bfc8ca', fontSize: 16, fontWeight: '500' },
  bentoGrid: { marginTop: 24, gap: 12 },
  
  // Card Principal (Ajustes sobre BentoCard)
  mainStatusCard: { backgroundColor: '#006782', overflow: 'hidden', padding: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  percentageText: { color: 'white', fontSize: 48, fontWeight: '800' },
  cardInfo: { color: '#baeaff', fontSize: 14, opacity: 0.9 },
  decorationCircle: { 
    position: 'absolute', right: -40, bottom: -40, width: 140, height: 140, 
    borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  
  // Row de sub-cards
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  smallCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  smallCardLabel: { color: '#6f787d', fontSize: 10, textTransform: 'uppercase' },
  smallCardValue: { color: '#c4ebe0', fontSize: 16, fontWeight: '700' },
  
  // Sección de Dispositivos
  devicesSection: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#c4ebe0', fontSize: 20, fontWeight: '700' },
  manageBtn: { color: '#86d0ef', fontWeight: '600' },
  
  // Tarjetas de Dispositivo individuales
  deviceCard: { backgroundColor: '#212a2c', padding: 4, marginBottom: 16 },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  deviceIconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deviceName: { color: '#ecf2f3', fontSize: 17, fontWeight: '700' },
  signalContainer: { flexDirection: 'row', gap: 4, marginTop: 8 },
  signalBar: { width: 4, height: 12, borderRadius: 2 },
  batteryInfo: { alignItems: 'flex-end' },
  batteryValue: { color: '#c4ebe0', fontSize: 20, fontWeight: '800' },
  batteryLabel: { color: '#6f787d', fontSize: 9, fontWeight: '800' },
  
  // Footer de estado dentro de la card
  statusFooter: { 
    backgroundColor: '#1d2426', 
    borderRadius: 22, 
    padding: 14, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#89d89d' },
  statusText: { color: '#bfc8ca', fontSize: 12 },
  statusTextInactive: { color: '#6f787d', fontSize: 12 },
  activeText: { color: '#86d0ef', fontSize: 12, fontWeight: '700' },
  linkedText: { color: '#bfc8ca', fontSize: 12, fontWeight: '700' },
  
  // Sección de Acción Final
  actionSection: { marginTop: 32, alignItems: 'center' },
  syncButton: { 
    width: '100%', 
    backgroundColor: '#006782', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    paddingVertical: 18, 
    borderRadius: 99,
    // Sombra para dar profundidad
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { color: 'white', fontSize: 17, fontWeight: '800' },
  syncNote: { color: '#6f787d', fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 18 }
});