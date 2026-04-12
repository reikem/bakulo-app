import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Utensils, Zap, ShoppingBag, Lightbulb } from 'lucide-react-native';

// --- CARD DE NUTRICIÓN (BENTO) ---
export const NutritionCard = ({ title, desc, tag, imageUri, isLarge }: any) => (
  <TouchableOpacity 
    style={[styles.nutritionCard, isLarge ? styles.largeCard : styles.smallCard]}
    activeOpacity={0.9}
  >
    <Image source={{ uri: imageUri }} style={styles.cardImage} />
    <View style={styles.overlay}>
      <View style={styles.tagBadge}>
        <Text style={styles.tagText}>{tag}</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{desc}</Text>
    </View>
  </TouchableOpacity>
);

// --- ITEM DE ESTILO DE VIDA ---
export const LifestyleItem = ({ title, desc, icon: Icon, color }: any) => (
    <View style={styles.lifestyleCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon color={color} size={28} />
      </View>
      <View style={{ flex: 1 }}>
        {/* CAMBIO: De <h3> a <Text> */}
        <Text style={styles.itemTitle}>{title}</Text> 
        <Text style={styles.itemDesc}>{desc}</Text>
      </View>
    </View>
  );

// --- PRODUCTO RECOMENDADO ---
export const ProductCard = ({ name, price, desc, category }: any) => (
  <View style={styles.productCard}>
    <View style={styles.productImagePlaceholder}>
      <ShoppingBag color="#c4ebe0" size={32} opacity={0.5} />
    </View>
    <Text style={styles.productCategory}>{category}</Text>
    <Text style={styles.productName}>{name}</Text>
    <Text style={styles.productDesc}>{desc}</Text>
    <View style={styles.productFooter}>
      <Text style={styles.productPrice}>${price}</Text>
      <TouchableOpacity style={styles.buyBtn}>
        <ShoppingBag color="#003746" size={16} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  nutritionCard: { borderRadius: 32, overflow: 'hidden', backgroundColor: '#1d2425' },
  largeCard: { width: '100%', height: 280, marginBottom: 16 },
  smallCard: { width: '100%', padding: 20, backgroundColor: '#2a3132' },
  cardImage: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
  overlay: { flex: 1, justifyContent: 'flex-end', padding: 24, backgroundColor: 'rgba(23,29,30,0.4)' },
  tagBadge: { backgroundColor: 'rgba(0,78,99,0.6)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start', marginBottom: 8 },
  tagText: { color: '#baeaff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  cardDesc: { color: '#bfc8cd', fontSize: 13, marginTop: 4 },
  lifestyleCard: { flexDirection: 'row', gap: 16, backgroundColor: '#1d2425', p: 20, borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  iconContainer: { padding: 12, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { color: '#f5fafb', fontSize: 16, fontWeight: '700' },
  itemDesc: { color: '#6f787d', fontSize: 13, marginTop: 2 },
  productCard: { width: 180, backgroundColor: '#2a3132', borderRadius: 24, padding: 16, marginRight: 16 },
  productImagePlaceholder: { width: '100%', aspectRatio: 1, backgroundColor: '#1d2425', borderRadius: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  productCategory: { color: '#a4f4b7', fontSize: 10, fontWeight: '800', marginBottom: 4 },
  productName: { color: '#f5fafb', fontSize: 14, fontWeight: '700' },
  productDesc: { color: '#6f787d', fontSize: 11, marginBottom: 12 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { color: '#c4ebe0', fontWeight: '800' },
  buyBtn: { backgroundColor: '#c4ebe0', padding: 8, borderRadius: 100 }
});