import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import WardrobeScreen from './app/wardrobe';
import CameraScreen from './app/camera';

export default function App() {
  const [showCamera, setShowCamera] = useState(false);

  if (showCamera) {
    return <CameraScreen />;
  }

  return (
    <View style={styles.container}>
      <WardrobeScreen onAddItem={() => setShowCamera(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});