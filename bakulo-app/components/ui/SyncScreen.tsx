import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { SyncSavedLocally, MonitorHeart, BluetoothConnected, Plus, ChevronRight, HelpCircle } from 'lucide-react-native';
import { SyncService } from '@/service/syncService';


export default function SyncScreen() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("2 mins ago");
  const spinValue = new Animated.Value(0);

  const handleSync = async () => {
    setIsSyncing(true);
    
    // Animación de rotación
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const result: any = await SyncService.performSync();
    
    setIsSyncing(false);
    spinValue.stopAnimation();
    setLastSync(result.lastSynced);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Sync Section */}
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.tag}>REAL-TIME CONNECTION</Text>
          <Text style={styles.heroTitle}>Sync your health ecosystem</Text>
          <Text style={styles.heroSub}>Centralize your glucose logs and vitals with clinical-grade encryption.</Text>
        </View>

        <View style={styles.syncContainer}>
          <TouchableOpacity 
            style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]} 
            onPress={handleSync}
            disabled={isSyncing}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <SyncSavedLocally color="#003746" size={24} />
            </Animated.View>
            <Text style={styles.syncBtnText}>{isSyncing ? "SYNCING..." : "SYNC NOW"}</Text>
          </TouchableOpacity>
          <Text style={styles.lastSyncText}>Last synced: {lastSync}</Text>
        </View>
      </View>

      {/* Medical Devices */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Medical Devices</Text>
          <Text style={styles.sectionSub}>Hardware monitors and sensors</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Plus color="#c4ebe0" size={16} />
          <Text style={styles.addBtnText}>Pair New</Text>
        </TouchableOpacity>
      </View>

      {/* Device Card (CGM) */}
      <View style={styles.deviceCard}>
        <View style={styles.iconContainer}>
          <MonitorHeart color="#c4ebe0" size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.deviceName}>Dexcom G6 CGM</Text>
            <View style={styles.statusBadge}>
              <View style={styles.dot} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
          </View>
          <Text style={styles.deviceSub}>Continuous Glucose Monitor</Text>
        </View>
      </View>

      {/* Troubleshooting Card */}
      <TouchableOpacity style={styles.helpCard}>
        <View style={styles.helpIconBg}>
          <HelpCircle color="#c4ebe0" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.helpTitle}>Having trouble syncing?</Text>
          <Text style={styles.helpSub}>Ensure Bluetooth is enabled and devices are nearby.</Text>
        </View>
        <ChevronRight color="rgba(255,255,255,0.2)" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  content: { padding: 20 },
  heroCard: { 
    backgroundColor: '#004e63', 
    borderRadius: 32, 
    padding: 24, 
    minHeight: 220, 
    justifyContent: 'space-between',
    marginBottom: 30 
  },
  tag: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 32 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 },
  syncContainer: { alignItems: 'center', marginTop: 20 },
  syncBtn: { 
    backgroundColor: '#c4ebe0', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 100,
    gap: 10
  },
  syncBtnDisabled: { opacity: 0.7 },
  syncBtnText: { color: '#003746', fontWeight: '800', fontSize: 14 },
  lastSyncText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  sectionTitle: { color: '#c4ebe0', fontSize: 22, fontWeight: '700' },
  sectionSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: '#c4ebe0', fontWeight: '600', fontSize: 14 },

  deviceCard: { backgroundColor: '#1d2425', borderRadius: 24, padding: 20, flexDirection: 'row', gap: 15, alignItems: 'center' },
  iconContainer: { width: 56, height: 56, backgroundColor: 'rgba(0,103,130,0.2)', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deviceName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deviceSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  statusBadge: { backgroundColor: 'rgba(0,82,41,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#89d89d' },
  statusText: { color: '#89d89d', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  helpCard: { backgroundColor: '#1d2425', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 30, borderLeftWidth: 4, borderLeftColor: '#006782' },
  helpIconBg: { backgroundColor: '#004e63', padding: 10, borderRadius: 14 },
  helpTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  helpSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 }
});