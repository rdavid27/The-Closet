import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import WardrobeScreen from './app/wardrobe';
import CameraScreen from './app/camera';
import OutfitsScreen from './app/outfits';

type Screen = 'wardrobe' | 'camera' | 'outfits';

export default function App() {
  const [screen, setScreen] = useState<Screen>('wardrobe');
  const [remixItemIds, setRemixItemIds] = useState<string[]>([]);

  if (screen === 'camera') {
    return <CameraScreen onDone={() => setScreen('wardrobe')} />;
  }

  if (screen === 'outfits') {
    return (
      <OutfitsScreen
        itemIds={remixItemIds}
        onBack={() => setScreen('wardrobe')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <WardrobeScreen
        onAddItem={() => setScreen('camera')}
        onRemix={(ids) => {
          setRemixItemIds(ids);
          setScreen('outfits');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});