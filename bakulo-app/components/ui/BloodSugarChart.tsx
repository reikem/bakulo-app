import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, Text as SvgText, G, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Interfaces para tipado de datos
interface ChartPoint {
  x: number;     // Posición 0 a 400 en el viewBox
  y: number;     // Posición 0 a 150 en el viewBox
  val: string;   // Valor a mostrar (ej: "105" o "25g")
  time: string;  // Etiqueta de tiempo (ej: "12 PM")
  status?: 'Normal' | 'High' | 'Low';
}

interface BloodSugarChartProps {
  glucoseData?: ChartPoint[];
  carbsData?: ChartPoint[];
}

export const BloodSugarChart = ({ 
  glucoseData = DEFAULT_GLUCOSE, 
  carbsData = DEFAULT_CARBS 
}: BloodSugarChartProps) => {
  const [mode, setMode] = useState<'glucose' | 'carbs'>('glucose');
  const [selectedIndex, setSelectedIndex] = useState(glucoseData.length - 1);

  const currentPoints = mode === 'glucose' ? glucoseData : carbsData;
  const color = mode === 'glucose' ? "#006782" : "#a4f4b7";
  const selectedPoint = currentPoints[selectedIndex] || currentPoints[0];

  // Generamos el Path de forma dinámica basado en los puntos recibidos
  const pathData = useMemo(() => {
    return currentPoints.reduce((acc, point, i) => {
      return i === 0 ? `M${point.x},${point.y}` : `${acc} L${point.x},${point.y}`;
    }, "");
  }, [currentPoints]);

  const areaData = `${pathData} L${currentPoints[currentPoints.length - 1].x},150 L${currentPoints[0].x},150 Z`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.tabs}>
          <TouchableOpacity 
            onPress={() => { setMode('glucose'); setSelectedIndex(glucoseData.length - 1); }}
            style={mode === 'glucose' ? styles.tabActive : styles.tabInactive}
          >
            <Text style={mode === 'glucose' ? styles.tabTextActive : styles.tabTextInactive}>Glucose</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setMode('carbs'); setSelectedIndex(carbsData.length - 1); }}
            style={mode === 'carbs' ? styles.tabActive : styles.tabInactive}
          >
            <Text style={mode === 'carbs' ? styles.tabTextActive : styles.tabTextInactive}>Carbs</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <Svg width="100%" height={150} viewBox="0 0 400 150" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Guías Horizontales */}
          {[30, 75, 120].map(y => (
            <Line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}

          <Path d={areaData} fill="url(#fillGrad)" />
          <Path d={pathData} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />

          {/* Marcador de punto seleccionado */}
          <G>
            <Circle 
              cx={selectedPoint.x} 
              cy={selectedPoint.y} 
              r="6" 
              fill={selectedPoint.status === 'High' ? '#ba1a1a' : color} 
              stroke="#1d2426" 
              strokeWidth="2" 
            />
            <SvgText 
              x={selectedPoint.x > 300 ? selectedPoint.x - 50 : selectedPoint.x + 12} 
              y={selectedPoint.y - 12} 
              fill="#f5fafb" 
              fontSize="12" 
              fontWeight="bold"
            >
              {selectedPoint.val}
            </SvgText>
          </G>

          {/* Zonas táctiles invisibles */}
          {currentPoints.map((p, i) => (
            <Rect
              key={i}
              x={p.x - 20}
              y="0"
              width="40"
              height="150"
              fill="transparent"
              onPress={() => setSelectedIndex(i)}
            />
          ))}
        </Svg>

        <View style={styles.timeLabels}>
          {currentPoints.map((p, i) => (
            <TouchableOpacity key={i} onPress={() => setSelectedIndex(i)}>
              <Text style={[
                styles.timeText, 
                selectedIndex === i && { color: color, fontWeight: '900' }
              ]}>
                {p.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

// DATOS POR DEFECTO (Mock Data)
const DEFAULT_GLUCOSE: ChartPoint[] = [
  { x: 0, y: 90, val: "95", time: "12AM" },
  { x: 100, y: 110, val: "82", time: "6AM" },
  { x: 200, y: 50, val: "155", time: "12PM", status: 'High' },
  { x: 300, y: 100, val: "110", time: "6PM" },
  { x: 400, y: 80, val: "102", time: "Now" }
];

const DEFAULT_CARBS: ChartPoint[] = [
  { x: 0, y: 140, val: "0g", time: "12AM" },
  { x: 100, y: 80, val: "45g", time: "6AM" },
  { x: 200, y: 60, val: "60g", time: "12PM" },
  { x: 300, y: 130, val: "15g", time: "6PM" },
  { x: 400, y: 110, val: "20g", time: "Now" }
];

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#c4ebe0' },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100, padding: 4 },
  tabActive: { backgroundColor: '#c4ebe0', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  tabInactive: { paddingHorizontal: 12, paddingVertical: 6 },
  tabTextActive: { color: '#00201a', fontSize: 10, fontWeight: '800' },
  tabTextInactive: { color: '#6f787d', fontSize: 10, fontWeight: '700' },
  chartWrapper: { backgroundColor: '#1d2426', borderRadius: 32, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  timeText: { color: '#6f787d', fontSize: 9, fontWeight: '600' }
});