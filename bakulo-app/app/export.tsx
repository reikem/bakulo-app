import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, Share2, FileText, Download, 
  Database, FileJson, FileCode, MessageCircle, 
  Send, Mail, Share, Lock 
} from 'lucide-react-native';

// Extraemos el ancho de la pantalla para los cálculos del grid
const { width } = Dimensions.get('window');

export default function ExportScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#86d0ef" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Export & Share</Text>
        </View>
        <Share2 color="#86d0ef" size={24} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroText}>
          Your health data belongs to you. Export your clinical history or share insights directly with your care team.
        </Text>

        {/* Formats Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Export Formats</Text>
          <Text style={styles.badge}>OFFLINE SECURE</Text>
        </View>

        <View style={styles.grid}>
          {/* PDF Card - Full Width */}
          <TouchableOpacity style={[styles.card, styles.fullCard]}>
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: '#064e3b' }]}>
                <FileText color="#34d399" size={24} />
              </View>
              <Download color="#475569" size={20} />
            </View>
            <Text style={styles.cardTitle}>Medical PDF</Text>
            <Text style={styles.cardSub}>Professional report formatted for doctors.</Text>
          </TouchableOpacity>

          {/* CSV & JSON */}
          <TouchableOpacity style={styles.card}>
            <View style={[styles.iconBox, styles.smallIconBox]}>
              <Database color="#86d0ef" size={20} />
            </View>
            <Text style={styles.cardTitle}>CSV Data</Text>
            <Text style={styles.cardSub}>Excel & analysis.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <View style={[styles.iconBox, styles.smallIconBox]}>
              <FileJson color="#86d0ef" size={20} />
            </View>
            <Text style={styles.cardTitle}>JSON Raw</Text>
            <Text style={styles.cardSub}>For developers.</Text>
          </TouchableOpacity>

          {/* Markdown */}
          <TouchableOpacity style={[styles.card, styles.rowCard]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}>
              <FileCode color="#34d399" size={20} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Markdown Summary</Text>
              <Text style={styles.cardSub}>Clean text for journals.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Social Section */}
        <Text style={[styles.sectionTitle, { marginTop: 32, marginBottom: 16 }]}>Social & Platforms</Text>
        <View style={styles.socialContainer}>
          <SocialBtn icon={<MessageCircle color="#25D366" />} label="WhatsApp" />
          <SocialBtn icon={<Send color="#0088cc" />} label="Telegram" />
          <SocialBtn icon={<Mail color="#86d0ef" />} label="Email" />
          <SocialBtn icon={<Share color="#94a3b8" />} label="More" />
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyCard}>
          <Lock color="#34d399" size={20} />
          <Text style={styles.privacyText}>
            Data is encrypted locally before export. Your medical history never touches our servers.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const SocialBtn = ({ icon, label }: any) => (
  <TouchableOpacity style={styles.socialBtn}>
    <View style={styles.socialIconCircle}>{icon}</View>
    <Text style={styles.socialLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: '#020617'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { color: '#86d0ef', fontSize: 24, fontWeight: '800' },
  scrollContent: { padding: 24 },
  heroText: { color: '#94a3b8', fontSize: 16, lineHeight: 24, marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '700' },
  badge: { color: '#86d0ef', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { 
    backgroundColor: '#0f172a', 
    borderRadius: 24, 
    padding: 20, 
    width: (width - 60) / 2 // Ahora 'width' está definido correctamente arriba
  },
  fullCard: { width: '100%' },
  rowCard: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  iconBox: { padding: 10, borderRadius: 16 },
  smallIconBox: { backgroundColor: 'rgba(134, 208, 239, 0.1)', alignSelf: 'flex-start', marginBottom: 12 },
  cardTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  cardSub: { color: '#64748b', fontSize: 12, marginTop: 4 },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: 20, borderRadius: 32 },
  socialBtn: { alignItems: 'center', gap: 8 },
  socialIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  socialLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '500' },
  privacyCard: { flexDirection: 'row', backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 16, borderRadius: 16, gap: 12, marginTop: 32, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.1)' },
  privacyText: { flex: 1, color: '#34d399', fontSize: 13, lineHeight: 18 }
});