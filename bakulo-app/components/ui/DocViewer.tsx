import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Sharing from 'expo-sharing';
import { FileText, FileSpreadsheet } from 'lucide-react-native';

export const DocViewer = ({ uri, fileName }: { uri: string, fileName: string }) => {
  const handleOpen = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  };

  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.csv');

  return (
    <TouchableOpacity style={styles.card} onPress={handleOpen}>
      <View style={styles.iconBox}>
        {isExcel ? <FileSpreadsheet color="#a4f4b7" /> : <FileText color="#86d0ef" />}
      </View>
      <View>
        <Text style={styles.fileName}>{fileName}</Text>
        <Text style={styles.subText}>Tap to open or share</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d2426', padding: 16, borderRadius: 16, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  fileName: { color: '#ecf2f3', fontSize: 14, fontWeight: '600' },
  subText: { color: '#6f787d', fontSize: 11 }
});