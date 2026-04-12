import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Image,
  Platform 
} from 'react-native';
import { 
  User, 
  Shield, 
  Moon, 
  Ruler, 
  FileOutput, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  BellRing, 
  RefreshCw 
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';

// Importación de rutas y componentes externos
import { ROUTES } from '@/constants/routes';
import { SecurityHero } from '@/components/ui/SecurityComponents';

export default function SettingsScreen() {
  const router = useRouter();

  // --- LÓGICA DE INTERACCIÓN ---

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to exit Clinical Serenity?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: () => router.replace(ROUTES.AUTH.LOGIN) 
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "A PDF file will be generated with your health records from the last 30 days.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Generate", onPress: () => console.log("Starting export...") }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent} 
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* HEADER: Título y Perfil Rápido */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subTitle}>CONFIGURATION & PREFERENCES</Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => router.push(ROUTES.SETTINGS.PROFILE)}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop' }} 
              style={styles.avatarMini} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid}>
        
        {/* COMPONENTE DE SEGURIDAD (Acceso Rápido) */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => router.push(ROUTES.SETTINGS.SECURITY_DETAIL)}
        >
          <SecurityHero status="Protección Activa" />
        </TouchableOpacity>

        {/* GRUPO 1: CUENTA Y SEGURIDAD */}
        <SettingsGroup title="Account Access">
          <SettingsItem 
            icon={<User color="#c4ebe0" size={22} />} 
            title="Profile" 
            subTitle="Personal info, health metrics" 
            bgIcon="rgba(0, 103, 130, 0.2)"
            onPress={() => router.push(ROUTES.SETTINGS.PROFILE)} 
          />
          <SettingsItem 
            icon={<Shield color="#c4ebe0" size={22} />} 
            title="Security & Privacy" 
            subTitle="FaceID, 2FA, Biometrics" 
            bgIcon="rgba(0, 103, 130, 0.2)"
            onPress={() => router.push(ROUTES.SETTINGS.SECURITY_DETAIL)}
          />
        </SettingsGroup>

        {/* GRUPO 2: ECOSISTEMA Y SINCRONIZACIÓN (Nuevo Foco) */}
        <SettingsGroup title="Devices & Sync">
          <SettingsItem 
            icon={<RefreshCw color="#a4f4b7" size={22} />} 
            title="Sync Health" 
            subTitle="CGM, Pump & Cloud status" 
            bgIcon="rgba(26, 108, 60, 0.2)"
            badge="98%"
            onPress={() => router.push('/SyncScreen')} // Asegúrate que esta ruta coincida con tu archivo
          />
          <SettingsItem 
            icon={<BellRing color="#a4f4b7" size={22} />} 
            title="Notifications" 
            subTitle="Alerts, reminders, push setup" 
            bgIcon="rgba(26, 108, 60, 0.2)"
            onPress={() => router.push(ROUTES.SETTINGS.NOTIFICATIONS)}
          />
        </SettingsGroup>

        {/* GRUPO 3: PREFERENCIAS DE APP */}
        <SettingsGroup title="App Preferences">
          <SettingsItem 
            icon={<Moon color="#bfc8ca" size={22} />} 
            title="Theme" 
            subTitle="Current: Dark Mode" 
            bgIcon="rgba(255, 255, 255, 0.05)"
            onPress={() => Alert.alert("Theme", "Dark mode is standard for Clinical Serenity.")}
          />
          <SettingsItem 
            icon={<Ruler color="#bfc8ca" size={22} />} 
            title="Units" 
            subTitle="Glucose: mg/dL" 
            bgIcon="rgba(255, 255, 255, 0.05)"
            badge="mg/dL"
            onPress={() => Alert.alert("Units", "Change to mmol/L in next update.")}
          />
        </SettingsGroup>

        {/* GRUPO 4: SISTEMA Y AYUDA */}
        <SettingsGroup title="System & Support">
          <SettingsItem 
            icon={<FileOutput color="#bfc8ca" size={22} />} 
            title="Data Export" 
            subTitle="Download medical logs" 
            bgIcon="rgba(255, 255, 255, 0.05)"
            onPress={handleExportData} 
          />
          <SettingsItem 
            icon={<HelpCircle color="#bfc8ca" size={22} />} 
            title="Help & Support" 
            subTitle="FAQs & contact support" 
            bgIcon="rgba(255, 255, 255, 0.05)"
            onPress={() => router.push(ROUTES.SETTINGS.SUPPORT)}
          />
        </SettingsGroup>

        {/* BOTÓN DE SALIDA */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          activeOpacity={0.8} 
          onPress={handleLogout}
        >
          <LogOut color="#93000a" size={20} />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.brandName}>CLINICAL SERENITY</Text>
          <Text style={styles.versionText}>Version 2.4.1</Text>
        </View>

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

// --- COMPONENTES AUXILIARES (Internal) ---

const SettingsGroup = ({ title, children }: any) => (
  <View style={styles.groupCard}>
    <View style={styles.groupHeader}>
      <Text style={styles.groupHeaderText}>{title}</Text>
    </View>
    <View style={styles.groupContent}>{children}</View>
  </View>
);

const SettingsItem = ({ icon, title, subTitle, bgIcon, badge, onPress }: any) => (
  <TouchableOpacity 
    style={styles.itemContainer} 
    activeOpacity={0.7}
    onPress={onPress} 
  >
    <View style={styles.itemLeft}>
      <View style={[styles.iconWrapper, { backgroundColor: bgIcon }]}>
        {icon}
      </View>
      <View>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSubTitle}>{subTitle}</Text>
      </View>
    </View>
    
    <View style={styles.itemRight}>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <ChevronRight color="#6f787d" size={18} />
    </View>
  </TouchableOpacity>
);

// --- ESTILOS ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  headerSection: { marginBottom: 32 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarMini: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: '#006782' },
  title: { color: '#c4ebe0', fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  subTitle: { color: '#bfc8ca', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, opacity: 0.6, marginTop: 4 },
  grid: { gap: 20 },
  groupCard: { backgroundColor: '#1d2426', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  groupHeader: { backgroundColor: 'rgba(255, 255, 255, 0.03)', paddingHorizontal: 20, paddingVertical: 12 },
  groupHeaderText: { color: '#c4ebe0', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  groupContent: { paddingVertical: 4 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrapper: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  itemSubTitle: { color: 'rgba(191, 200, 202, 0.5)', fontSize: 12 },
  badge: { backgroundColor: 'rgba(196, 235, 224, 0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: '#c4ebe0', fontSize: 10, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#ffdad6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 24, marginTop: 10, gap: 10 },
  logoutText: { color: '#93000a', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  footer: { marginTop: 20, alignItems: 'center', opacity: 0.4 },
  brandName: { color: '#bfc8ca', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  versionText: { color: '#bfc8ca', fontSize: 11, marginTop: 4 }
});