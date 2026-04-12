import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, ChevronRight, TestTube, BookOpenText } from 'lucide-react-native';

// Datos estáticos de ejemplo (replicando la imagen)
const mockDocuments = [
  { id: '1', title: 'Blood Panel Results', date: 'Oct 12, 2023', size: '1.2MB', type: 'blood' },
  { id: '2', title: 'Endocrinologist Summary', date: 'Oct 05, 2023', size: '840KB', type: 'summary' },
];

interface UploadedDocumentsProps {
  onManageAll: () => void;
  onOpenDocument: (docId: string) => void;
}

// Sub-componente para cada item de documento
const DocumentItem = ({ doc, onOpen }: { doc: any, onOpen: () => void }) => {
  // Elegir icono basado en el tipo
  const Icon = doc.type === 'blood' ? TestTube : FileText;

  return (
    <View style={styles.docItem}>
      <View style={styles.docInfoContainer}>
        <View style={styles.iconWrapper}>
          <Icon color="#86d0ef" size={20} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.docTitle}>{doc.title}</Text>
          <Text style={styles.docDetails}>
            Uploaded on {doc.date} • {doc.size}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onOpen} style={styles.arrowBtn}>
        <ChevronRight color="#bfc8cd" size={20} />
      </TouchableOpacity>
    </View>
  );
};

export const UploadedDocuments = ({ onManageAll, onOpenDocument }: UploadedDocumentsProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Uploaded Documents</Text>
        <TouchableOpacity onPress={onManageAll}>
          <Text style={styles.manageAllText}>Manage All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.docsList}>
        {mockDocuments.map((doc) => (
          <DocumentItem key={doc.id} doc={doc} onOpen={() => onOpenDocument(doc.id)} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#f5f5f5', fontSize: 22, fontWeight: '800' },
  manageAllText: { color: '#86d0ef', fontSize: 14, fontWeight: '600' },
  docsList: { gap: 12 },
  docItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1d2426', padding: 16, borderRadius: 24, paddingRight: 10 },
  docInfoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrapper: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#333b3d', justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1, marginLeft: 15 },
  docTitle: { color: '#c4ebe0', fontSize: 15, fontWeight: '700' },
  docDetails: { color: '#6f787d', fontSize: 11, marginTop: 2 },
  arrowBtn: { padding: 10 },
});