import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Download } from 'lucide-react-native';

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
              {/* VALOR FIJO ARRIBA: Se posiciona absolutamente respecto al wrapper */}
              <View style={[styles.valueContainer, isSelected && styles.valueContainerActive]}>
                <Text style={[styles.valueText, isSelected && styles.valueTextActive]}>
                  {item.value}
                </Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.7}
                // Eventos para Web (Mouse)
                {...(Platform.OS === 'web' ? {
                  onMouseEnter: () => setHoveredIndex(index),
                  onMouseLeave: () => setHoveredIndex(null),
                } : {
                  // Eventos para Móvil (Touch)
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

const styles = StyleSheet.create({
  chartCard: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 32, 
    padding: 20, 
    paddingTop: 40, // Espacio extra para las etiquetas de arriba
    marginBottom: 24 
  },
  chartHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 40 
  },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartIndicator: { width: 3, height: 18, backgroundColor: '#86d0ef', borderRadius: 2 },
  chartTitle: { color: '#f5f5f5', fontSize: 15, fontWeight: '700' },
  exportBtn: { backgroundColor: '#333b3d', padding: 8, borderRadius: 10 },
  
  barContainer: { 
    height: 120, 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'space-between',
  },
  barWrapper: { 
    flex: 1, 
    alignItems: 'center', 
    position: 'relative', // Vital para el posicionamiento del valor
  },
  
  // CONTENEDOR DEL VALOR (Encima de la barra)
  valueContainer: {
    position: 'absolute',
    top: -25, // Lo empuja hacia arriba de la barra
    backgroundColor: 'transparent',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    minWidth: 30,
    alignItems: 'center',
  },
  valueContainerActive: {
    backgroundColor: '#c4ebe0', // Fondo destacado al seleccionar
  },
  valueText: {
    color: '#6f787d', // Color discreto por defecto
    fontSize: 10,
    fontWeight: '700',
  },
  valueTextActive: {
    color: '#121212', // Contraste alto al seleccionar
    fontSize: 11,
    fontWeight: '900',
  },

  bar: { 
    width: 12, 
    borderRadius: 6,
  },
  barInactive: { backgroundColor: 'rgba(134, 208, 239, 0.15)' },
  barActive: { backgroundColor: '#86d0ef' },
  
  dayText: { 
    color: '#6f787d', 
    fontSize: 10, 
    fontWeight: '700', 
    marginTop: 8 
  },
});

export default GlucoseTrendsChart;