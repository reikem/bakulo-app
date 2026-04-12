import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Pdf from 'react-native-pdf';

export const PDFViewer = ({ uri }: { uri: string }) => (
  <View style={styles.container}>
    <Pdf
      source={{ uri, cache: true }}
      style={styles.pdf}
      onError={(error) => console.log(error)}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, height: 400 },
  pdf: { flex: 1, width: Dimensions.get('window').width - 48, borderRadius: 16 }
});