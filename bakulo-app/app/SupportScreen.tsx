import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { 
  Search, 
  Rocket, 
  Smartphone, 
  Bug, 
  MessageCircle, 
  Mail, 
  ArrowLeft 
} from 'lucide-react-native';

export default function SupportScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Ocultamos el header nativo */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER CON BOTÓN BACK */}
      <SafeAreaView style={styles.headerSafeArea}>
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
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How can we support{"\n"}your journey?</Text>
        
        <View style={styles.searchContainer}>
          <Search color="#006782" size={20} />
          <TextInput 
            placeholder="Search for articles..." 
            placeholderTextColor="#40484a" 
            style={styles.searchInput}
          />
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={[styles.card, styles.cardLarge]}>
            <View style={styles.iconBox}><Rocket color="#c4ebe0" /></View>
            <Text style={styles.cardTitle}>Getting Started</Text>
            <Text style={styles.cardSub}>New to Clinical Serenity? Learn the basics.</Text>
            <Text style={styles.cardAction}>View 12 articles →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.cardHighlight]}>
            <View style={styles.iconBoxDark}><Smartphone color="#004e63" /></View>
            <Text style={[styles.cardTitle, { color: '#00201a' }]}>Devices</Text>
            <Text style={{ color: '#004d62', fontSize: 12 }}>Syncing CGMs & wearables.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <View style={styles.iconBox}><Bug color="#c4ebe0" /></View>
            <Text style={styles.cardTitle}>App Issues</Text>
            <Text style={styles.cardSub}>Bug reports and performance.</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Still need assistance?</Text>
          <Text style={styles.ctaSub}>Our medical support team is available 24/7.</Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.btnPrimary}>
              <MessageCircle color="#00201a" size={18} />
              <Text style={styles.btnPrimaryText}>Live Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary}>
              <Mail color="#fff" size={18} />
              <Text style={styles.btnSecondaryText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  
  // Estilos del Header
  headerSafeArea: { backgroundColor: '#171d1e' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginLeft: -4 },
  iconCircle: {
    backgroundColor: 'rgba(0,103,130,0.2)',
    padding: 10,
    borderRadius: 14,
  },

  content: { padding: 24, paddingBottom: 100 },
  title: { color: '#c4ebe0', fontSize: 32, fontWeight: '800', lineHeight: 38, marginBottom: 20, marginTop: 10 },
  searchContainer: { backgroundColor: '#1d2426', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 20, height: 60, marginBottom: 30 },
  searchInput: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 16 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  card: { backgroundColor: '#1d2426', borderRadius: 30, padding: 20, width: '47.8%', justifyContent: 'space-between' },
  cardLarge: { width: '100%', minHeight: 160 },
  cardHighlight: { backgroundColor: '#c4ebe0' },
  
  iconBox: { width: 44, height: 44, backgroundColor: '#004e63', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  iconBoxDark: { width: 44, height: 44, backgroundColor: 'rgba(0, 78, 99, 0.1)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  
  cardTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '700' },
  cardSub: { color: '#bfc8ca', fontSize: 12, marginTop: 4, opacity: 0.7 },
  cardAction: { color: '#c4ebe0', fontSize: 14, fontWeight: '600', marginTop: 15 },
  
  ctaCard: { backgroundColor: '#004e63', borderRadius: 40, padding: 30, marginTop: 40, alignItems: 'center' },
  ctaTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  ctaSub: { color: '#9fe2ff', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 25 },
  
  ctaButtons: { flexDirection: 'row', gap: 12 },
  btnPrimary: { backgroundColor: '#c4ebe0', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, gap: 8, alignItems: 'center' },
  btnPrimaryText: { color: '#00201a', fontWeight: '700' },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, gap: 8, alignItems: 'center' },
  btnSecondaryText: { color: '#fff', fontWeight: '700' }
});