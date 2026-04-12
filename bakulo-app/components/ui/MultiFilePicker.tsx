import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, X, FileText, FilePlus } from 'lucide-react-native';

interface FileItem {
  uri: string;
  id: string | number;
  name: string;
  type: 'image' | 'pdf' | 'doc';
}

interface MultiFilePickerProps {
  files: FileItem[];
  setFiles: (files: FileItem[]) => void;
  maxFiles?: number;
}

export const MultiFilePicker = ({ files, setFiles, maxFiles = 6 }: MultiFilePickerProps) => {

  const handleAddPress = () => {
    if (files.length >= maxFiles) {
      Alert.alert("Límite alcanzado", `Máximo ${maxFiles} archivos.`);
      return;
    }

    Alert.alert("Adjuntar", "Selecciona el tipo de archivo", [
      { text: "Cámara (Foto)", onPress: takePhoto },
      { text: "Galería (Fotos)", onPress: pickImages },
      { text: "Documentos (PDF/Otros)", onPress: pickDocument },
      { text: "Cancelar", style: "cancel" }
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Error", "Sin acceso a cámara");

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      const newFile: FileItem = {
        uri: result.assets[0].uri,
        id: Date.now().toString(),
        name: `Scan_${Date.now()}.jpg`,
        type: 'image'
      };
      setFiles([...files, newFile]);
    }
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Nueva API sin Warning
      allowsMultipleSelection: true,
      selectionLimit: maxFiles - files.length,
      quality: 0.5,
    });

    if (!result.canceled) {
      const selected = result.assets.map(asset => ({
        uri: asset.uri,
        id: Math.random().toString(36).substring(7),
        name: asset.fileName || `IMG_${Date.now()}.jpg`,
        type: 'image' as const
      }));
      setFiles([...files, ...selected]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: true
      });

      if (!result.canceled) {
        const selected = result.assets.map(asset => ({
          uri: asset.uri,
          id: Math.random().toString(36).substring(7),
          name: asset.name,
          type: asset.mimeType?.includes('pdf') ? 'pdf' : 'doc' as const
        }));
        setFiles([...files, ...selected]);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo cargar el documento");
    }
  };

  const removeFile = (id: string | number) => {
    setFiles(files.filter(f => f.id !== id));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.scanBox, files.length >= maxFiles && styles.disabled]} 
        onPress={handleAddPress}
        disabled={files.length >= maxFiles}
      >
        <View style={styles.iconCircle}>
          <FilePlus color="#86d0ef" size={30} />
        </View>
        <Text style={styles.title}>Scan or Select</Text>
        <Text style={styles.sub}>Photos, lab results or medical notes (PDF/Doc).</Text>
      </TouchableOpacity>

      {files.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
          {files.map((file) => (
            <View key={file.id} style={styles.card}>
              {file.type === 'image' ? (
                <Image source={{ uri: file.uri }} style={styles.preview} />
              ) : (
                <View style={styles.docPreview}>
                  <FileText color="#86d0ef" size={30} />
                  <Text style={styles.docLabel} numberOfLines={1}>{file.name}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.remove} onPress={() => removeFile(file.id)}>
                <X color="#fff" size={10} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 15 },
  scanBox: { 
    borderWidth: 2, borderColor: '#40484a', borderStyle: 'dashed', 
    borderRadius: 28, padding: 30, alignItems: 'center', backgroundColor: 'rgba(134, 208, 239, 0.02)' 
  },
  disabled: { opacity: 0.5 },
  iconCircle: { 
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#1d2426', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15 
  },
  title: { color: '#f5f5f5', fontSize: 18, fontWeight: '800' },
  sub: { color: '#6f787d', fontSize: 13, textAlign: 'center', marginTop: 5 },
  list: { marginTop: 20 },
  card: { 
    width: 90, height: 90, borderRadius: 18, backgroundColor: '#1d2426', 
    marginRight: 12, overflow: 'hidden', position: 'relative' 
  },
  preview: { width: '100%', height: '100%' },
  docPreview: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 5 },
  docLabel: { color: '#6f787d', fontSize: 8, marginTop: 4, textAlign: 'center' },
  remove: { 
    position: 'absolute', top: 5, right: 5, backgroundColor: '#ba1a1a', 
    width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' 
  }
});