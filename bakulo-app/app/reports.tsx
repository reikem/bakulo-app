import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Platform, Alert, Modal, Image, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { 
  ArrowLeft, Bell, FileText, ChevronRight, 
  TestTube, Camera, X, TrendingDown, 
  AlertTriangle, CheckCircle2, FilePlus, Download 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- 1. COMPONENTE: GLUCOSE TRENDS (Barras Personalizadas) ---
const GlucoseTrendsChart = ({ range }: { range: 'Weekly' | 'Monthly' }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const WEEKLY_DATA = [
    { label: 'M', value: 112, h: 45 }, { label: 'T', value: 98, h: 35 },
    { label: 'W', value: 125, h: 60 }, { label: 'T', value: 142, h: 85 },
    { label: 'F', value: 118, h: 50 }, { label: 'S', value: 105, h: 40 },
    { label: 'S', value: 122, h: 55 },
  ];

  const MONTHLY_DATA = [
    { label: 'Jan', value: 105, h: 40 }, { label: 'Feb', value: 118, h: 52 },
    { label: 'Mar', value: 132, h: 75 }, { label: 'Apr', value: 110, h: 45 },
    { label: 'May', value: 95, h: 35 }, { label: 'Jun', value: 140, h: 88 },
    { label: 'Jul', value: 125, h: 60 },
  ];

  const currentData = range === 'Weekly' ? WEEKLY_DATA : MONTHLY_DATA;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <View style={styles.chartIndicator} />
          <Text style={styles.chartTitle}>Glucose Trends</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn}>
          <Download color="#fff" size={14} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.barContainer}>
        {currentData.map((item, index) => {
          const isSelected = hoveredIndex === index;
          return (
            <View key={`${range}-${index}`} style={styles.barWrapper}>
              <View style={[styles.valueContainer, isSelected && styles.valueContainerActive]}>
                <Text style={[styles.valueText, isSelected && styles.valueTextActive]}>
                  {item.value}
                </Text>
              </View>
              <TouchableOpacity 
                activeOpacity={0.7}
                {...(Platform.OS === 'web' ? {
                  onMouseEnter: () => setHoveredIndex(index),
                  onMouseLeave: () => setHoveredIndex(null),
                } : {
                  onPressIn: () => setHoveredIndex(index),
                  onPressOut: () => setHoveredIndex(null),
                })}
                style={[
                  styles.bar, 
                  { height: item.h }, 
                  isSelected ? styles.barActive : styles.barInactive
                ]} 
              />
              <Text style={[styles.dayText, isSelected && { color: '#86d0ef' }]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// --- 2. COMPONENTE: BENTO STATS ---
const BentoStats = ({ average, trend, hyper }: any) => (
  <View style={styles.bentoGrid}>
    <View style={styles.mainStatCard}>
      <Text style={styles.statLabel}>AVG GLUCOSE</Text>
      <View style={styles.statRow}>
        <Text style={styles.statValue}>{average}</Text>
        <Text style={styles.statUnit}>mg/dL</Text>
      </View>
      <View style={styles.trendBadge}>
        <TrendingDown color="#89d89d" size={14} />
        <Text style={styles.trendText}>{trend}</Text>
      </View>
    </View>
    <View style={styles.statsColumn}>
      <View style={styles.miniCard}>
        <AlertTriangle color="#86d0ef" size={18} />
        <Text style={styles.miniValue}>{hyper}</Text>
      </View>
      <View style={styles.miniCard}>
        <CheckCircle2 color="#89d89d" size={18} />
        <Text style={styles.miniValue}>88%</Text>
      </View>
    </View>
  </View>
);

// --- 3. COMPONENTE: TIME IN RANGE ---
const TimeInRange = ({ percentage }: { percentage: number }) => (
  <View style={styles.tirCard}>
    <View style={styles.tirHeader}>
      <Text style={styles.tirTitle}>Time In Range</Text>
      <Text style={styles.tirPercent}>{percentage}%</Text>
    </View>
    <View style={styles.progressBar}>
      <View style={[styles.segment, { width: '10%', backgroundColor: '#ba1a1a' }]} />
      <View style={[styles.segment, { width: `${percentage}%`, backgroundColor: '#005229' }]} />
      <View style={[styles.segment, { width: `${90 - percentage}%`, backgroundColor: '#004e63' }]} />
    </View>
  </View>
);

// --- 4. COMPONENTE: UPLOADED DOCUMENTS (Lista de 2) ---
const UploadedDocuments = ({ onManageAll }: any) => (
  <View style={styles.docsSection}>
    <View style={styles.docsHeader}>
      <Text style={styles.sectionTitle}>Uploaded Documents</Text>
      <TouchableOpacity onPress={onManageAll}>
        <Text style={styles.manageAllLink}>Manage All</Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity style={styles.docItem}>
      <View style={styles.docIconBox}><TestTube color="#86d0ef" size={20} /></View>
      <View style={styles.docTextContent}>
        <Text style={styles.docName}>Blood Panel Results</Text>
        <Text style={styles.docDate}>Uploaded on Oct 12, 2023 • 1.2MB</Text>
      </View>
      <ChevronRight color="#6f787d" size={20} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.docItem}>
      <View style={styles.docIconBox}><FileText color="#86d0ef" size={20} /></View>
      <View style={styles.docTextContent}>
        <Text style={styles.docName}>Endocrinologist Summary</Text>
        <Text style={styles.docDate}>Uploaded on Oct 05, 2023 • 840KB</Text>
      </View>
      <ChevronRight color="#6f787d" size={20} />
    </TouchableOpacity>
  </View>
);

// --- 5. COMPONENTE: MULTI FILE PICKER (Híbrido) ---
const MultiFilePicker = ({ files, setFiles }: any) => {
  const handleAddPress = () => {
    Alert.alert("Adjuntar", "Selecciona el origen", [
      { text: "Cámara", onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
          if (!res.canceled) setFiles([...files, { uri: res.assets[0].uri, id: Date.now(), type: 'image' }]);
      }},
      { text: "Galería", onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.5 });
          if (!res.canceled) setFiles([...files, ...res.assets.map(a => ({ uri: a.uri, id: Math.random(), type: 'image' }))]);
      }},
      { text: "Documento (PDF)", onPress: async () => {
          const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true });
          if (!res.canceled) setFiles([...files, ...res.assets.map(a => ({ uri: a.uri, id: Math.random(), type: 'pdf', name: a.name }))]);
      }},
      { text: "Cancelar", style: "cancel" }
    ]);
  };

  return (
    <View>
      <TouchableOpacity style={styles.scanBox} onPress={handleAddPress}>
        <View style={styles.scanIconCircle}><FilePlus color="#86d0ef" size={30} /></View>
        <Text style={styles.scanTitle}>Scan New Document</Text>
        <Text style={styles.scanSub}>Upload lab results or medical notes (Photos or PDFs).</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
        {files.map((file: any) => (
          <View key={file.id} style={styles.previewThumb}>
            {file.type === 'image' ? (
              <Image source={{ uri: file.uri }} style={styles.thumbImg} />
            ) : (
              <View style={[styles.thumbImg, styles.docThumb]}><FileText color="#86d0ef" size={24} /></View>
            )}
            <TouchableOpacity style={styles.removeThumb} onPress={() => setFiles(files.filter((f: any) => f.id !== file.id))}>
              <X color="#fff" size={10} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// --- PANTALLA PRINCIPAL ---
export default function ReportsScreen() {
  const router = useRouter();
  const [range, setRange] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const [tableVisible, setTableVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}><ArrowLeft color="#bfc8ca" size={24} /></TouchableOpacity>
        <Text style={styles.brand}>Serenity</Text>
        <TouchableOpacity style={styles.iconBtn}><Bell color="#bfc8ca" size={24} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Text style={styles.mainTitle}>Reports</Text>
          <View style={styles.rangeTabs}>
            {(['Weekly', 'Monthly'] as const).map((r) => (
              <TouchableOpacity key={r} onPress={() => setRange(r)} style={[styles.tab, range === r && styles.tabActive]}>
                <Text style={[styles.tabText, range === r && { color: '#fff' }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <BentoStats average={range === 'Weekly' ? 114 : 128} trend="-4%" hyper={range === 'Weekly' ? 3 : 12} />
        
        <GlucoseTrendsChart range={range} />
        
        <TimeInRange percentage={88} />
        <UploadedDocuments onManageAll={() => setTableVisible(true)} />
        <MultiFilePicker files={newFiles} setFiles={setNewFiles} />
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={tableVisible} animationType="slide">
         <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>All Documents</Text>
                <TouchableOpacity onPress={() => setTableVisible(false)}><X color="#fff" size={24} /></TouchableOpacity>
            </View>
            <ScrollView>
                <View style={styles.table}>
                   <View style={[styles.tableRow, { backgroundColor: '#333b3d' }]}>
                      <Text style={[styles.cell, { fontWeight: '800', color: '#86d0ef' }]}>Name</Text>
                      <Text style={[styles.cell, { fontWeight: '800', color: '#86d0ef' }]}>Date</Text>
                   </View>
                   {['Blood Panel', 'Endo Summary', 'Lab Result', 'Cardio Report'].map((item, i) => (
                       <View key={i} style={styles.tableRow}>
                           <Text style={styles.cell}>{item}</Text>
                           <Text style={styles.cell}>Oct {10+i}, 2023</Text>
                       </View>
                   ))}
                </View>
            </ScrollView>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  brand: { color: '#c4ebe0', fontSize: 22, fontWeight: '800' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1d2426', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { color: '#c4ebe0', fontSize: 32, fontWeight: '800' },
  rangeTabs: { flexDirection: 'row', backgroundColor: '#1d2426', borderRadius: 12, padding: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tabActive: { backgroundColor: '#004e63' },
  tabText: { color: '#6f787d', fontSize: 12, fontWeight: '600' },

  // --- Estilos del Chart ---
  chartCard: { backgroundColor: '#1a1a1a', borderRadius: 32, padding: 20, paddingTop: 40, marginBottom: 24 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartIndicator: { width: 3, height: 18, backgroundColor: '#86d0ef', borderRadius: 2 },
  chartTitle: { color: '#f5f5f5', fontSize: 15, fontWeight: '700' },
  exportBtn: { backgroundColor: '#333b3d', padding: 8, borderRadius: 10 },
  barContainer: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barWrapper: { flex: 1, alignItems: 'center', position: 'relative' },
  valueContainer: { position: 'absolute', top: -25, backgroundColor: 'transparent', paddingVertical: 2, paddingHorizontal: 4, borderRadius: 4, minWidth: 30, alignItems: 'center' },
  valueContainerActive: { backgroundColor: '#c4ebe0' },
  valueText: { color: '#6f787d', fontSize: 10, fontWeight: '700' },
  valueTextActive: { color: '#121212', fontSize: 11, fontWeight: '900' },
  bar: { width: 12, borderRadius: 6 },
  barInactive: { backgroundColor: 'rgba(134, 208, 239, 0.15)' },
  barActive: { backgroundColor: '#86d0ef' },
  dayText: { color: '#6f787d', fontSize: 10, fontWeight: '700', marginTop: 8 },

  // Bento
  bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  mainStatCard: { flex: 1.2, backgroundColor: '#004e63', borderRadius: 24, padding: 20 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800' },
  statValue: { color: '#fff', fontSize: 32, fontWeight: '800' },
  statUnit: { color: '#fff', opacity: 0.6, fontSize: 14 },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 5 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', padding: 6, borderRadius: 12, alignSelf: 'flex-start' },
  trendText: { color: '#fff', fontSize: 10 },
  statsColumn: { flex: 0.8, gap: 12 },
  miniCard: { flex: 1, backgroundColor: '#1d2426', borderRadius: 20, padding: 15, justifyContent: 'center', alignItems: 'center' },
  miniValue: { color: '#c4ebe0', fontSize: 20, fontWeight: '800', marginTop: 5 },

  // Time In Range
  tirCard: { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, marginBottom: 25 },
  tirHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  tirTitle: { color: '#c4ebe0', fontWeight: '700' },
  tirPercent: { color: '#89d89d', fontWeight: '800', fontSize: 18 },
  progressBar: { height: 10, backgroundColor: '#333b3d', borderRadius: 5, flexDirection: 'row', overflow: 'hidden' },
  segment: { height: '100%' },

  // Docs Section
  docsSection: { marginBottom: 25 },
  docsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#f5f5f5', fontSize: 22, fontWeight: '800' },
  manageAllLink: { color: '#86d0ef', fontWeight: '600' },
  docItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d2426', padding: 15, borderRadius: 20, marginBottom: 10 },
  docIconBox: { width: 44, height: 44, backgroundColor: '#333b3d', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  docTextContent: { flex: 1, marginLeft: 15 },
  docName: { color: '#c4ebe0', fontWeight: '700', fontSize: 15 },
  docDate: { color: '#6f787d', fontSize: 11, marginTop: 2 },

  // Scan Box
  scanBox: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#40484a', borderRadius: 28, padding: 30, alignItems: 'center', backgroundColor: 'rgba(134, 208, 239, 0.02)' },
  scanIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1d2426', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  scanTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scanSub: { color: '#6f787d', textAlign: 'center', fontSize: 12, marginTop: 5, lineHeight: 18 },

  // Previews
  previewScroll: { marginTop: 15 },
  previewThumb: { width: 70, height: 70, borderRadius: 12, marginRight: 10, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  docThumb: { backgroundColor: '#333b3d', justifyContent: 'center', alignItems: 'center' },
  removeThumb: { position: 'absolute', top: 2, right: 2, backgroundColor: '#ba1a1a', borderRadius: 10, padding: 2 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#171d1e', padding: 20, paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  table: { backgroundColor: '#1d2426', borderRadius: 20, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#333b3d', justifyContent: 'space-between' },
  cell: { color: '#bfc8ca', flex: 1 }
});