import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
// 1. Iconos de lucide-react-native corregidos
import { 
  ArrowLeft, 
  AlertTriangle, 
  Utensils, 
  TrendingUp, 
  CheckCheck, 
  ChevronRight,
  RefreshCcw 
} from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Oculta el header de la navegación por defecto */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Personalizado con botón Back funcional */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <ArrowLeft color="#c4ebe0" size={22} />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Clinical Serenity</Text>
        
        <View style={styles.profileBox}>
          <Image 
            source={{ uri: 'https://randomuser.me/api/portraits/med/men/7.jpg' }} 
            style={styles.profileImg} 
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.mainTitle}>Notifications</Text>
            <Text style={styles.subTitle}>Stay updated with your health journey.</Text>
          </View>
          <TouchableOpacity style={styles.markAllBtn}>
             <CheckCheck color="#c4ebe0" size={16} />
             <Text style={styles.markAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          <NotificationItem 
            icon={<AlertTriangle color="#ffdad6" size={24} />}
            bgIcon="#ba1a1a"
            title="Low Glucose Alert"
            time="2m ago"
            description="Your glucose levels are at 72 mg/dL. Please consume 15g of fast-acting carbs immediately."
            urgent
          />

          <NotificationItem 
            icon={<Utensils color="#00201b" size={24} />}
            bgIcon="#c4ebe0"
            title="Lunch Reminder"
            time="45m ago"
            description="Time to log your lunch. Tracking your meals helps maintain stable glucose levels."
          />

          <NotificationItem 
            icon={<TrendingUp color="#9fe2ff" size={24} />}
            bgIcon="#004e63"
            title="Weekly Report Ready"
            time="3h ago"
            description="Your health summary for the past 7 days is ready. You were in range 88% of the time."
          />

          <View style={styles.daySeparator}>
            <Text style={styles.dayText}>YESTERDAY</Text>
            <View style={styles.dayLine} />
          </View>

          <NotificationItem 
            icon={<RefreshCcw color="#bfc8ca" size={24} />}
            bgIcon="rgba(255,255,255,0.05)"
            title="Data Sync Complete"
            time="1d ago"
            description="Your continuous glucose monitor (CGM) data has been successfully synced."
            opacity={0.6}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// Sub-componente para los ítems de notificación
const NotificationItem = ({ icon, bgIcon, title, time, description, urgent, opacity = 1 }: any) => (
  <View style={[styles.notiCard, { opacity }, urgent && styles.urgentCard]}>
    <View style={[styles.iconContainer, { backgroundColor: bgIcon }]}>
      {icon}
    </View>
    <View style={styles.notiTextContent}>
      <View style={styles.notiHeaderRow}>
        <Text style={styles.notiTitle}>{title}</Text>
        <Text style={[styles.notiTime, urgent && { color: '#ffb4ab' }]}>{time}</Text>
      </View>
      <Text style={styles.notiDesc}>{description}</Text>
      
      <TouchableOpacity style={styles.viewBtn}>
        <Text style={styles.viewBtnText}>Ver detalle</Text>
        <ChevronRight color="#86d0ef" size={14} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: '#1d2426'
  },
  headerTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '800' },
  backBtn: { padding: 4 },
  iconCircle: {
    backgroundColor: 'rgba(0,103,130,0.2)',
    padding: 8,
    borderRadius: 12
  },
  profileBox: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#006782' },
  profileImg: { width: '100%', height: '100%' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24 },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  mainTitle: { color: '#f5fafb', fontSize: 28, fontWeight: '800' },
  subTitle: { color: '#bfc8cd', fontSize: 14, marginTop: 4 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(196, 235, 224, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100 },
  markAllText: { color: '#c4ebe0', fontSize: 12, fontWeight: '700' },
  list: { gap: 16 },
  notiCard: { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, flexDirection: 'row', gap: 16 },
  urgentCard: { borderWidth: 1, borderColor: 'rgba(186, 26, 26, 0.4)', backgroundColor: 'rgba(186, 26, 26, 0.05)' },
  iconContainer: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  notiTextContent: { flex: 1 },
  notiHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notiTitle: { color: '#f5fafb', fontSize: 16, fontWeight: '700' },
  notiTime: { color: '#bfc8cd', fontSize: 12, fontWeight: '600' },
  notiDesc: { color: '#bfc8cd', fontSize: 14, lineHeight: 20 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  viewBtnText: { color: '#86d0ef', fontSize: 12, fontWeight: '800' },
  daySeparator: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 12 },
  dayText: { color: '#6f787d', fontSize: 10, fontWeight: '800' },
  dayLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});