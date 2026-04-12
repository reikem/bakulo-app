import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Image, Dimensions, Platform 
} from 'react-native';
import { 
  Search, Beaker, ClipboardList, Upload, Eye, 
  Clock, Utensils, Droplets, ChevronRight, Lightbulb
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState('docs');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* --- SECCIÓN 1: UP NEXT (Agregado) --- */}
      <Text style={styles.headerTitle}>Up Next</Text>
      <View style={styles.timeline}>
        <TimelineItem 
          icon={<Utensils color="#9beaae" size={22} />} 
          bg="#005229" 
          title="Lunch" 
          time="12:30 PM" 
        />
        <TimelineItem 
          icon={<Droplets color="#baeaff" size={22} />} 
          bg="#004d62" 
          title="Glucose Check" 
          time="02:00 PM" 
        />
      </View>

      {/* --- SECCIÓN 2: INSIGHTS (Agregado) --- */}
      <Text style={[styles.headerTitle, { marginTop: 32 }]}>Recent Insights</Text>
      <TouchableOpacity style={styles.insightCard} activeOpacity={0.8}>
        <View style={styles.insightHeader}>
            <Lightbulb color="#86d0ef" size={18} />
            <Text style={styles.insightBadgeText}>SMART ANALYSIS</Text>
        </View>
        <Text style={styles.insightText}>
          Your glucose levels have been 15% more stable this week compared to last. Keep up the good work with your morning walks!
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* --- SECCIÓN 3: REPOSITORIO (Original) --- */}
      <View style={styles.repoHeader}>
        <Text style={styles.repoTitle}>Repositorio</Text>
        <Text style={styles.repoSub}>Manage health and nutrition assets.</Text>
      </View>

      {/* Selector de Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'docs' && styles.tabActive]} 
          onPress={() => setActiveTab('docs')}
        >
          <Text style={[styles.tabText, activeTab === 'docs' && styles.tabTextActive]}>Documentos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recipes' && styles.tabActive]} 
          onPress={() => setActiveTab('recipes')}
        >
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>Recetas</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchBar}>
        <Search color="#6f787d" size={20} />
        <TextInput 
          placeholder="Buscar..." 
          placeholderTextColor="#6f787d"
          style={styles.searchInput}
        />
      </View>

      {/* Grid de Documentos */}
      <View style={styles.docGrid}>
        <DocCard 
          icon={<Beaker color="#486b63" size={22} />} 
          title="Análisis Hemoglobina" 
          date="12 OCT" 
          color="#c4ebe0"
        />
        <DocCard 
          icon={<ClipboardList color="#004d62" size={22} />} 
          title="Receta Insulina" 
          date="05 SEP" 
          color="#baeaff"
        />
        <TouchableOpacity style={styles.uploadCard}>
          <Upload color="#006782" size={22} />
          <Text style={styles.uploadText}>Subir</Text>
        </TouchableOpacity>
      </View>

      {/* Espaciador final */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Sub-componentes
const TimelineItem = ({ icon, bg, title, time }: any) => (
  <TouchableOpacity style={styles.item}>
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
      {icon}
    </View>
    <View style={styles.info}>
      <Text style={styles.itemLabel}>{title}</Text>
      <Text style={styles.itemTime}>{time}</Text>
    </View>
    <ChevronRight color="#4a5153" size={20} />
  </TouchableOpacity>
);

const DocCard = ({ icon, title, date, color }: any) => (
  <View style={styles.docCard}>
    <View style={styles.docTop}>
      <View style={[styles.iconBoxSmall, { backgroundColor: color }]}>{icon}</View>
      <Text style={styles.docDate}>{date}</Text>
    </View>
    <Text style={styles.docTitle} numberOfLines={1}>{title}</Text>
    <View style={styles.viewRow}>
      <Eye color="#006782" size={12} />
      <Text style={styles.viewText}>VER</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 24 },
  
  // Up Next & Insights
  headerTitle: { color: '#86d0ef', fontSize: 24, fontWeight: '800', marginBottom: 16, fontFamily: 'Manrope' },
  timeline: { gap: 10 },
  item: { 
    flexDirection: 'row', 
    backgroundColor: '#1a1a1a', 
    padding: 14, 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 14 },
  itemLabel: { color: '#6f787d', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemTime: { color: '#f5fafb', fontSize: 16, fontWeight: '700' },
  
  insightCard: { 
    backgroundColor: 'rgba(134, 208, 239, 0.05)', 
    padding: 20, 
    borderRadius: 24, 
    borderLeftWidth: 3, 
    borderLeftColor: '#86d0ef',
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  insightBadgeText: { color: '#86d0ef', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  insightText: { color: '#bfc8ca', fontSize: 14, lineHeight: 20 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 32 },

  // Repositorio Original adaptado
  repoHeader: { marginBottom: 20 },
  repoTitle: { fontSize: 26, fontWeight: '800', color: '#f5fafb' },
  repoSub: { fontSize: 13, color: '#6f787d', marginTop: 2 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 100, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 100 },
  tabActive: { backgroundColor: '#004e63' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6f787d' },
  tabTextActive: { color: '#fff' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 16, borderRadius: 14, height: 50, marginBottom: 24 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, color: '#f5fafb' },

  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  docCard: { width: (width - 68) / 2, backgroundColor: '#1a1a1a', padding: 14, borderRadius: 20 },
  docTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  iconBoxSmall: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docDate: { fontSize: 9, color: '#6f787d', fontWeight: '700' },
  docTitle: { fontSize: 13, fontWeight: '700', color: '#f5fafb', marginBottom: 6 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewText: { fontSize: 9, fontWeight: '800', color: '#006782' },

  uploadCard: { width: (width - 68) / 2, backgroundColor: 'transparent', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#333b3d', alignItems: 'center', justifyContent: 'center', gap: 4 },
  uploadText: { fontSize: 11, fontWeight: '700', color: '#6f787d' }
});