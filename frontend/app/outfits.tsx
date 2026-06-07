import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';

const BACKEND_URL = 'http://10.92.16.166:8000';

type Outfit = {
  outfit_id?: string;
  image_urls: string[];
  categories: string[];
  occasion: string;
  item_ids: string[];
};

function OutfitCard({ outfit, onSave }: { outfit: Outfit; onSave: (outfit: Outfit) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.occasionBadge}>
        <Text style={styles.occasionText}>{outfit.occasion}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
        {outfit.image_urls.map((url, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image
              source={{ uri: url }}
              style={styles.itemImage}
              contentFit="cover"
              recyclingKey={url}
              cachePolicy="memory-disk"
            />
            <Text style={styles.categoryLabel}>{outfit.categories[index]}</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={() => onSave(outfit)}>
        <Text style={styles.saveButtonText}>Save Look</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OutfitsScreen({
  itemIds,
  onBack,
}: {
  itemIds: string[];
  onBack: () => void;
}) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const generateOutfits = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/stylist/remix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_ids: itemIds }),
      });

      const data = await response.json();

      if (response.status === 201) {
        setOutfits(data.outfits);
      } else {
        Alert.alert('Error', data.detail || 'Failed to generate outfits');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [itemIds]);

  useState(() => {
    generateOutfits();
  });

  function handleSave(outfit: Outfit) {
    const key = outfit.outfit_id || outfit.item_ids.join('-');
    setSaved(prev => new Set([...prev, key]));
    Alert.alert('Saved!', 'This look has been saved to your collection.');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Looks</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Generating your looks...</Text>
        </View>
      ) : outfits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No outfits generated</Text>
          <Text style={styles.emptySubtitle}>
            Try adding items from different categories like tops, bottoms, and shoes.
          </Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={onBack}>
            <Text style={styles.backButtonLargeText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subtitle}>{outfits.length} looks generated from your wardrobe</Text>
          {outfits.map((outfit, index) => (
            <OutfitCard
              key={outfit.outfit_id || index}
              outfit={outfit}
              onSave={handleSave}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  backButton: {
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
    width: 60,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  occasionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  occasionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    textTransform: 'capitalize',
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageWrapper: {
    marginRight: 12,
    alignItems: 'center',
  },
  itemImage: {
    width: 100,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  categoryLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  saveButton: {
    backgroundColor: '#111',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButtonLarge: {
    backgroundColor: '#111',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  backButtonLargeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});