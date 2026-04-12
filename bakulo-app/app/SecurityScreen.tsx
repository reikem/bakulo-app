import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Platform,
  SafeAreaView 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Fingerprint, 
  Lock, 
  EyeOff, 
  Trash2, 
  ChevronRight, 
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Stethoscope
} from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';

// Importamos tus componentes base
import { SecurityHero, SecurityToggleItem } from '@/components/ui/SecurityComponents';

export default function SecurityScreen() {
  const router = useRouter();

  // --- ESTADOS DE PRIVACIDAD Y SEGURIDAD ---
  const [isFaceIdEnabled, setIsFaceIdEnabled] = useState(true);
  const [isIncognito, setIsIncognito] = useState(false);
  const [isDoctorShareEnabled, setIsDoctorShareEnabled] = useState(true);

  // --- LÓGICA DE FUNCIONALIDADES ---

  const handleToggleFaceID = async () => {
    if (!isFaceIdEnabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Activar acceso biométrico',
      });
      if (result.success) setIsFaceIdEnabled(true);
    } else {
      setIsFaceIdEnabled(false);
    }
  };

  const handleSetup2FA = () => {
    Alert.alert(
      "Configurar 2FA",
      "¿Deseas recibir un código de verificación vía SMS cada vez que inicies sesión?",
      [
        { text: "Ahora no", style: "cancel" },
        { text: "Configurar SMS", onPress: () => console.log("2FA Setup Start") }
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Cambiar Contraseña",
      "Te enviaremos un enlace de recuperación a tu correo registrado.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Enviar Enlace", onPress: () => Alert.alert("Enviado", "Revisa tu bandeja de entrada.") }
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      "ACCIÓN IRREVERSIBLE",
      "Al eliminar tus datos, perderás acceso a todo tu historial de salud, tendencias y configuraciones. ¿Deseas continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar Definitivamente", style: "destructive", onPress: () => console.log("Account Purged") }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#c4ebe0" size={24} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Seguridad y Privacidad</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION (Estado de la cuenta) */}
        <SecurityHero status="Protección Activa" />

        {/* SEGURIDAD DE ACCESO */}
        <Text style={styles.sectionLabel}>SEGURIDAD DE ACCESO</Text>
        <SecurityToggleItem 
          title="Desbloqueo Biométrico"
          desc="Usa FaceID o Huella para acceder rápidamente."
          icon={<Fingerprint color="#a9cec4" size={28} />}
          isEnabled={isFaceIdEnabled}
          onToggle={handleToggleFaceID}
        />

        {/* AUTHENTICATION & PASSWORD GRID */}
        <View style={styles.grid}>
          {/* Two Factor */}
          <View style={styles.authCard}>
            <View style={styles.recommendedBadge}>
              <CheckCircle2 color="#89d89d" size={14} />
              <Text style={styles.recommendedText}>RECOMENDADO</Text>
            </View>
            <Text style={styles.cardTitle}>Autenticación 2FA</Text>
            <Text style={styles.cardDesc}>Capa extra de seguridad vía SMS o App.</Text>
            <TouchableOpacity style={styles.cardButtonPrimary} onPress={handleSetup2FA}>
              <Text style={styles.buttonTextPrimary}>Configurar</Text>
            </TouchableOpacity>
          </View>

          {/* Password Management */}
          <View style={styles.authCard}>
            <Text style={styles.cardTitle}>Contraseña</Text>
            <Text style={styles.cardDesc}>Última actualización:{"\n"}<Text style={{fontStyle: 'italic', color: '#bfc8ca'}}>Hace 3 meses</Text></Text>
            <TouchableOpacity style={styles.cardButtonOutline} onPress={handleChangePassword}>
              <Text style={styles.buttonTextOutline}>Cambiar ahora</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PRIVACIDAD DE DATOS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>PRIVACIDAD DE DATOS</Text>
          <Text style={styles.sectionLabelExtra}>AJUSTES AVANZADOS</Text>
        </View>

        <View style={styles.listContainer}>
          <SecurityToggleItem 
            title="Modo Incógnito"
            desc="Ocultar registros médicos de la vista general."
            icon={<EyeOff color="#006782" size={22} />}
            isEnabled={isIncognito}
            onToggle={() => setIsIncognito(!isIncognito)}
          />
          <View style={styles.divider} />
          <SecurityToggleItem 
            title="Compartir con Doctores"
            desc="Sincronización automática de reportes."
            icon={<Stethoscope color="#1a6c3c" size={22} />}
            isEnabled={isDoctorShareEnabled}
            onToggle={() => setIsDoctorShareEnabled(!isDoctorShareEnabled)}
          />
        </View>

        {/* ACCIONES CRÍTICAS */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteData}>
          <View style={styles.deleteLeft}>
            <Trash2 color="#ba1a1a" size={22} />
            <Text style={styles.deleteText}>Solicitar Eliminación de Datos</Text>
          </View>
          <ChevronRight color="rgba(186, 26, 26, 0.4)" size={20} />
        </TouchableOpacity>

        <Text style={styles.deleteWarning}>
          Esta acción es irreversible. Al eliminar tus datos, perderás acceso a todo tu historial de salud, tendencias y configuraciones personalizadas de Equilibrium Health.
        </Text>

        {/* CUMPLIMIENTO (FOOTER) */}
        <View style={styles.complianceContainer}>
          <View style={styles.complianceBadges}>
            <View style={styles.badgeItem}><ShieldCheck color="#6f787d" size={14}/><Text style={styles.badgeText}>HIPAA COMPLIANT</Text></View>
            <View style={styles.badgeItem}><Lock color="#6f787d" size={14}/><Text style={styles.badgeText}>GDPR READY</Text></View>
          </View>
          <Text style={styles.complianceFooter}>
            CUMPLIMOS CON LOS MÁS ALTOS ESTÁNDARES INTERNACIONALES DE CIBERSEGURIDAD MÉDICA.
          </Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1213' },
  headerSafe: { backgroundColor: '#0b1213' },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { backgroundColor: 'rgba(0,103,130,0.2)', padding: 10, borderRadius: 16 },
  navTitle: { color: '#f5fafb', fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 24 },
  sectionLabel: { color: '#c4ebe0', fontSize: 11, fontWeight: '800', marginBottom: 16, letterSpacing: 1.2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionLabelExtra: { color: '#6f787d', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  
  // GRID CARDS
  grid: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  authCard: { flex: 1, backgroundColor: '#1c2527', borderRadius: 28, padding: 20, justifyContent: 'space-between', minHeight: 160 },
  recommendedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  recommendedText: { color: '#89d89d', fontSize: 9, fontWeight: '800' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardDesc: { color: '#6f787d', fontSize: 11, marginTop: 4, lineHeight: 15 },
  cardButtonPrimary: { backgroundColor: '#3f484c', paddingVertical: 10, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  buttonTextPrimary: { color: '#baeaff', fontSize: 13, fontWeight: '700' },
  cardButtonOutline: { borderWidth: 1, borderColor: 'rgba(111, 120, 125, 0.3)', paddingVertical: 10, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  buttonTextOutline: { color: '#baeaff', fontSize: 13, fontWeight: '700' },

  // LIST
  listContainer: { backgroundColor: '#1c2527', borderRadius: 28, overflow: 'hidden', marginBottom: 24 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20 },

  // DELETE
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(186, 26, 26, 0.05)', padding: 20, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(186, 26, 26, 0.2)' },
  deleteLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteText: { color: '#ba1a1a', fontWeight: '800', fontSize: 14 },
  deleteWarning: { color: '#6f787d', fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 18, paddingHorizontal: 10 },

  // COMPLIANCE
  complianceContainer: { marginTop: 40, alignItems: 'center', gap: 12 },
  complianceBadges: { flexDirection: 'row', gap: 20, opacity: 0.5 },
  badgeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: '#bfc8cd', fontSize: 10, fontWeight: '700' },
  complianceFooter: { color: '#6f787d', fontSize: 10, fontWeight: '600', textAlign: 'center', letterSpacing: 0.5, lineHeight: 16 }
});