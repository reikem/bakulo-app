import React from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, Dimensions 
} from 'react-native';
import { TrendingDown, LogOut, ChevronRight } from 'lucide-react-native';

// --- INTERFACES ---
interface EditorialHeaderProps {
  name: string;
  condition: string;
  age: number;
  imageUri: string;
}

interface StatsCardProps {
  label: string;
  value: string | number;
  unit: string;
  trend: string;
  progress: number;
}

interface EcosystemProps {
  name: string;
  desc: string;
  connected: boolean;
  icon: React.ReactNode;
  onPress: () => void;
}

// --- COMPONENTES ---

export const EditorialHeader = ({ name, condition, age, imageUri }: EditorialHeaderProps) => (
  <View style={styles.profileHeaderSection}>
    <View style={styles.imageContainer}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: imageUri }} style={styles.avatar} />
      </View>
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>T1D ACTIVE</Text>
      </View>
    </View>
    <Text style={styles.userName}>{name}</Text>
    <Text style={styles.userDetails}>{age} Years • {condition}</Text>
  </View>
);

export const HealthStatsCard = ({ label, value, unit, trend, progress }: StatsCardProps) => (
  <View style={styles.statsCard}>
    <View style={styles.statsHeader}>
      <View>
        <Text style={styles.statsLabel}>{label}</Text>
        <View style={styles.glucoseContainer}>
          <Text style={styles.glucoseValue}>{value}</Text>
          <Text style={styles.glucoseUnit}>{unit}</Text>
        </View>
      </View>
      <View style={styles.trendingBadge}>
        <TrendingDown color="#89d89d" size={14} />
        <Text style={styles.trendingText}>{trend}</Text>
      </View>
    </View>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <View style={styles.progressLabels}>
      <Text style={styles.rangeLabel}>STABILITY RANGE</Text>
      <Text style={styles.inRangeValue}>{progress}% IN-RANGE</Text>
    </View>
  </View>
);

export const ClinicalBenchmark = ({ label, value, unit, borderColor }: any) => (
  <View style={[styles.benchmarkItem, { borderLeftColor: borderColor }]}>
    <Text style={styles.benchLabel}>{label}</Text>
    <Text style={styles.benchValue}>{value}</Text>
    <Text style={styles.benchUnit}>{unit}</Text>
  </View>
);

export const EcosystemItem = ({ name, desc, connected, icon, onPress }: EcosystemProps) => (
  <TouchableOpacity style={styles.ecoItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.ecoLeft}>
      <View style={[styles.ecoIconWrapper, connected && { backgroundColor: 'rgba(0,103,130,0.15)' }]}>
        {icon}
      </View>
      <View>
        <Text style={styles.ecoName}>{name}</Text>
        <Text style={styles.ecoDesc}>{desc}</Text>
      </View>
    </View>
    <View style={styles.statusRow}>
      <View style={[styles.dot, { backgroundColor: connected ? '#005229' : '#ba1a1a' }]} />
      <Text style={[styles.statusText, { color: connected ? '#89d89d' : '#ffdad6' }]}>
        {connected ? 'Synced' : 'Connect'}
      </Text>
      <ChevronRight color="rgba(255,255,255,0.2)" size={16} />
    </View>
  </TouchableOpacity>
);

export const SignOutButton = ({ onPress }: { onPress: () => void }) => (
  <View style={styles.footerContainer}>
    <TouchableOpacity style={styles.signOutBtn} onPress={onPress}>
      <LogOut color="#ba1a1a" size={20} />
      <Text style={styles.signOutText}>Sign Out</Text>
    </TouchableOpacity>
    <Text style={styles.versionText}>EQUILIBRIUM HEALTH • V 2.4.1</Text>
  </View>
);

const styles = StyleSheet.create({
  profileHeaderSection: { alignItems: 'center', marginBottom: 24 },
  imageContainer: { position: 'relative', marginBottom: 16 },
  avatarWrapper: { width: 120, height: 120, borderRadius: 40, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  avatar: { width: '100%', height: '100%' },
  badgeContainer: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#005229', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#89d89d', fontSize: 10, fontWeight: '800' },
  userName: { color: '#ecf2f3', fontSize: 28, fontWeight: '800' },
  userDetails: { color: '#6f787d', fontSize: 14, marginTop: 4 },
  statsCard: { backgroundColor: '#1d2426', borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  statsLabel: { color: '#6f787d', fontSize: 12 },
  glucoseContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  glucoseValue: { color: '#f5fafb', fontSize: 44, fontWeight: '800' },
  glucoseUnit: { color: '#6f787d', fontSize: 16 },
  trendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(137,216,157,0.1)', padding: 6, borderRadius: 8 },
  trendingText: { color: '#89d89d', fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, marginTop: 20 },
  progressBarFill: { height: '100%', backgroundColor: '#006782', borderRadius: 10 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rangeLabel: { color: '#6f787d', fontSize: 10, fontWeight: '800' },
  inRangeValue: { color: '#89d89d', fontSize: 10, fontWeight: '800' },
  benchmarkItem: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderLeftWidth: 4, marginBottom: 12 },
  benchLabel: { color: '#6f787d', fontSize: 10, fontWeight: '800' },
  benchValue: { color: '#f5fafb', fontSize: 22, fontWeight: '700' },
  benchUnit: { color: '#6f787d', fontSize: 12 },
  ecoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  ecoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ecoIconWrapper: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  ecoName: { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },
  ecoDesc: { color: '#6f787d', fontSize: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  footerContainer: { alignItems: 'center', paddingVertical: 30 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(186,26,26,0.3)' },
  signOutText: { color: '#ba1a1a', fontWeight: '700' },
  versionText: { color: '#3f484c', fontSize: 9, marginTop: 12, letterSpacing: 2 }
});