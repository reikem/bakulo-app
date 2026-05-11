/**
 * app/(tabs)/settings.tsx — v2
 *
 * CAMBIOS:
 *   ✅ Botón Logout ELIMINADO (está en ProfileScreen)
 *   ✅ Agregado acceso a AchievementsScreen
 *   ✅ Agregado acceso a ChangePassword
 *   ✅ Versión actualizada
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, Platform,
} from 'react-native';
import {
  User, Shield, Moon, Ruler, FileOutput, HelpCircle,
  ChevronRight, BellRing, RefreshCw, Trophy, Lock,
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { ROUTES } from '@/constants/routes';
import { SecurityHero } from '@/components/ui/SecurityComponents';
import { db_getCurrentUser } from '@/service/database';

export default function SettingsScreen() {
  const router = useRouter();
  const user   = db_getCurrentUser();

  const handleExportData = () => {
    Alert.alert(
      'Exportar Datos',
      'Se generará un reporte con tus registros de salud.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a Reportes', onPress: () => router.push('/reports') },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false }}/>

      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Ajustes</Text>
            <Text style={styles.subTitle}>CONFIGURACIÓN Y PREFERENCIAS</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(ROUTES.SETTINGS.PROFILE)}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarMini}/>
            ) : (
              <View style={[styles.avatarMini, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>
                  {(user?.displayName ?? 'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid}>

        {/* Seguridad */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(ROUTES.SETTINGS.SECURITY_DETAIL)}>
          <SecurityHero status="Protección Activa"/>
        </TouchableOpacity>

        {/* Cuenta */}
        <SettingsGroup title="Cuenta">
          <SettingsItem
            icon={<User color="#c4ebe0" size={22}/>}
            title="Perfil"
            subTitle="Información personal, logros y rachas"
            bgIcon="rgba(0,103,130,0.2)"
            onPress={() => router.push(ROUTES.SETTINGS.PROFILE)}
          />
          <SettingsItem
            icon={<Shield color="#c4ebe0" size={22}/>}
            title="Seguridad y Privacidad"
            subTitle="FaceID, 2FA, Biometría"
            bgIcon="rgba(0,103,130,0.2)"
            onPress={() => router.push(ROUTES.SETTINGS.SECURITY_DETAIL)}
          />
          <SettingsItem
            icon={<Lock color="#c4ebe0" size={22}/>}
            title="Cambiar Contraseña"
            subTitle="Actualiza tu contraseña de acceso"
            bgIcon="rgba(0,103,130,0.2)"
            onPress={() => router.push('/ChangePassword')}
          />
        </SettingsGroup>

        {/* Logros */}
        <SettingsGroup title="Logros y Gamificación">
          <SettingsItem
            icon={<Trophy color="#f59e0b" size={22}/>}
            title="Mis Logros"
            subTitle="Desbloquea logros, rachas y XP"
            bgIcon="rgba(245,158,11,0.15)"
            badge="¡Nuevo!"
            onPress={() => router.push('/AchievementsScreen')}
          />
        </SettingsGroup>

        {/* Dispositivos y Sync */}
        <SettingsGroup title="Dispositivos y Sincronización">
          <SettingsItem
            icon={<RefreshCw color="#a4f4b7" size={22}/>}
            title="Sincronizar Salud"
            subTitle="CGM, Bomba y estado de la nube"
            bgIcon="rgba(26,108,60,0.2)"
            badge="98%"
            onPress={() => router.push('/SyncScreen')}
          />
          <SettingsItem
            icon={<BellRing color="#a4f4b7" size={22}/>}
            title="Notificaciones"
            subTitle="Alertas, recordatorios y push"
            bgIcon="rgba(26,108,60,0.2)"
            onPress={() => router.push(ROUTES.SETTINGS.NOTIFICATIONS)}
          />
        </SettingsGroup>

        {/* Preferencias */}
        <SettingsGroup title="Preferencias de App">
          <SettingsItem
            icon={<Moon color="#bfc8ca" size={22}/>}
            title="Tema"
            subTitle="Actual: Modo Oscuro"
            bgIcon="rgba(255,255,255,0.05)"
            onPress={() => Alert.alert('Tema', 'El modo oscuro es estándar en Serenity.')}
          />
          <SettingsItem
            icon={<Ruler color="#bfc8ca" size={22}/>}
            title="Unidades"
            subTitle="Glucosa: mg/dL"
            bgIcon="rgba(255,255,255,0.05)"
            badge="mg/dL"
            onPress={() => Alert.alert('Unidades', 'Cambio a mmol/L disponible próximamente.')}
          />
        </SettingsGroup>

        {/* Sistema */}
        <SettingsGroup title="Sistema y Soporte">
          <SettingsItem
            icon={<FileOutput color="#bfc8ca" size={22}/>}
            title="Exportar Datos"
            subTitle="Descarga reportes de salud"
            bgIcon="rgba(255,255,255,0.05)"
            onPress={handleExportData}
          />
          <SettingsItem
            icon={<HelpCircle color="#bfc8ca" size={22}/>}
            title="Ayuda y Soporte"
            subTitle="Preguntas frecuentes y contacto"
            bgIcon="rgba(255,255,255,0.05)"
            onPress={() => router.push(ROUTES.SETTINGS.SUPPORT)}
          />
        </SettingsGroup>

        {/* Footer — SIN botón de logout */}
        <View style={styles.footer}>
          <Text style={styles.brandName}>SERENITY</Text>
          <Text style={styles.versionText}>Versión 2.5.0</Text>
          <Text style={styles.footerHint}>
            Para cerrar sesión ve a tu Perfil
          </Text>
        </View>

        <View style={{ height: 100 }}/>
      </View>
    </ScrollView>
  );
}

// ─── COMPONENTES ──────────────────────────────────────────────────────────────

const SettingsGroup = ({ title, children }: any) => (
  <View style={styles.groupCard}>
    <View style={styles.groupHeader}>
      <Text style={styles.groupHeaderText}>{title}</Text>
    </View>
    <View style={styles.groupContent}>{children}</View>
  </View>
);

const SettingsItem = ({ icon, title, subTitle, bgIcon, badge, onPress }: any) => (
  <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.itemLeft}>
      <View style={[styles.iconWrapper, { backgroundColor: bgIcon }]}>{icon}</View>
      <View>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSubTitle}>{subTitle}</Text>
      </View>
    </View>
    <View style={styles.itemRight}>
      {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
      <ChevronRight color="#6f787d" size={18}/>
    </View>
  </TouchableOpacity>
);

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#171d1e' },
  scrollContent:   { paddingHorizontal:24, paddingTop:Platform.OS==='ios'?60:40 },
  headerSection:   { marginBottom:32 },
  headerTop:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  avatarMini:      { width:52, height:52, borderRadius:26, borderWidth:1.5, borderColor:'#006782' },
  avatarPlaceholder:{ backgroundColor:'#004e63', alignItems:'center', justifyContent:'center' },
  avatarInitials:  { color:'#c4ebe0', fontSize:18, fontWeight:'800' },
  title:           { color:'#c4ebe0', fontSize:34, fontWeight:'800', letterSpacing:-0.5 },
  subTitle:        { color:'#bfc8ca', fontSize:10, fontWeight:'700', letterSpacing:1.5, opacity:0.6, marginTop:4 },
  grid:            { gap:20 },
  groupCard:       { backgroundColor:'#1d2426', borderRadius:28, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.03)' },
  groupHeader:     { backgroundColor:'rgba(255,255,255,0.03)', paddingHorizontal:20, paddingVertical:12 },
  groupHeaderText: { color:'#c4ebe0', fontSize:9, fontWeight:'800', letterSpacing:1.2, textTransform:'uppercase' },
  groupContent:    { paddingVertical:4 },
  itemContainer:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14 },
  itemLeft:        { flexDirection:'row', alignItems:'center', gap:14, flex:1 },
  itemRight:       { flexDirection:'row', alignItems:'center', gap:10 },
  iconWrapper:     { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center' },
  itemTitle:       { color:'#ffffff', fontSize:16, fontWeight:'600' },
  itemSubTitle:    { color:'rgba(191,200,202,0.5)', fontSize:12 },
  badge:           { backgroundColor:'rgba(196,235,224,0.1)', paddingHorizontal:10, paddingVertical:3, borderRadius:8 },
  badgeText:       { color:'#c4ebe0', fontSize:10, fontWeight:'700' },
  footer:          { marginTop:20, alignItems:'center', opacity:0.5, gap:4 },
  brandName:       { color:'#bfc8ca', fontSize:10, fontWeight:'800', letterSpacing:2 },
  versionText:     { color:'#bfc8ca', fontSize:11 },
  footerHint:      { color:'#6f787d', fontSize:10, marginTop:4 },
});