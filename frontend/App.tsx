import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import CameraScreen from './app/camera';

export default function App() {
  const [showCamera, setShowCamera] = useState(false);

  if (showCamera) {
    return <CameraScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Closet AI</Text>
      <TouchableOpacity style={styles.button} onPress={() => setShowCamera(true)}>
        <Text style={styles.buttonText}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});