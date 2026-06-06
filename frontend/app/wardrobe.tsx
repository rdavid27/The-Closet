import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';

const BACKEND_URL = 'http://10.92.16.166:8000';
const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (SCREEN_WIDTH - 48) / NUM_COLUMNS;

type WardrobeItem = {
  id: string;
  image_url: string;
  category: string;
  color: string[];
  tags: string[];
  processing_status: string;
  created_at: string;
};

type ItemsResponse = {
  items: WardrobeItem[];
  page: number;
  limit: number;
  has_more: boolean;
};

// Skeleton card shown while loading
function SkeletonCard() {
  return <View style={styles.skeletonCard} />;
}

// Empty state shown when user has no items
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Your closet is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add your first item to get started
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAdd}>
        <Text style={styles.emptyButtonText}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );
}

// Individual item card
function ItemCard({ item }: { item: WardrobeItem }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image_url }}
        style={styles.cardImage}
        contentFit="cover"
        recyclingKey={item.id}
        cachePolicy="memory-disk"
      />
      <View style={styles.cardFooter}>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <Text style={styles.cardStatus}>{item.processing_status}</Text>
      </View>
    </View>
  );
}

export default function WardrobeScreen({ onAddItem }: { onAddItem: () => void }) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async (pageNum: number, replace: boolean) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/closet/items?page=${pageNum}&limit=20`
      );
      const data: ItemsResponse = await response.json();

      if (replace) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }

      setPage(pageNum);
      setHasMore(data.has_more);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  // Load on mount
  useState(() => {
    fetchItems(1, true);
  });

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems(1, true);
  }, [fetchItems]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchItems(page + 1, false);
  }, [loadingMore, hasMore, page, fetchItems]);

  // Show skeletons on initial load
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Closet</Text>
        </View>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Closet</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddItem}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={items}
        numColumns={NUM_COLUMNS}
        estimatedItemSize={ITEM_SIZE + 48}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ItemCard item={item} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={<EmptyState onAdd={onAddItem} />}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.loadingMore} />
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  addButton: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: ITEM_SIZE,
  },
  cardFooter: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
    textTransform: 'capitalize',
  },
  cardStatus: {
    fontSize: 10,
    color: '#999',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  skeletonCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE + 48,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#e8e8e8',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#111',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingMore: {
    paddingVertical: 16,
  },
});