// app/favorites.tsx or app/(tabs)/favorites.tsx
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Favorite, getFavorites, removeFromFavorites } from '@/services/favoritesService';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 150;

type FavoriteWithDimensions = Favorite & {
  calculatedWidth: number;
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteWithDimensions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    favorite: Favorite;
  } | null>(null);

  // Process images to calculate their width
  const processFavorites = async (favs: Favorite[]): Promise<FavoriteWithDimensions[]> => {
    return await Promise.all(
      favs.map(async (fav) => {
        try {
          return await new Promise<FavoriteWithDimensions>((resolve) => {
            Image.getSize(
              fav.imageUrl,
              (imgWidth, imgHeight) => {
                const aspectRatio = imgWidth / imgHeight;
                const calculatedWidth = IMAGE_HEIGHT * aspectRatio;
                
                resolve({
                  ...fav,
                  calculatedWidth: Math.max(calculatedWidth, 60)
                });
              },
              (error) => {
                console.error(`Failed to get size for ${fav.scientificName}:`, error);
                resolve({
                  ...fav,
                  calculatedWidth: IMAGE_HEIGHT
                });
              }
            );
          });
        } catch (error) {
          console.error('Error processing favorite image:', error);
          return {
            ...fav,
            calculatedWidth: IMAGE_HEIGHT
          };
        }
      })
    );
  };

  // Load favorites
  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const favs = await getFavorites(user.uid);
      const processedFavs = await processFavorites(favs);
      setFavorites(processedFavs);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadFavorites();
  }, [user]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
  };

  // Handle species press
  const handleSpeciesPress = (speciesKey: number, scientificName: string) => {
    router.push({
      pathname: '/DetailedDescription',
      params: {
        speciesKey: speciesKey,
        scientificName: scientificName
      }
    });
  };

  // Handle context menu
  const handleContextMenu = (event: any, favorite: Favorite) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
      favorite
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Remove from favorites
  const handleRemoveFromFavorites = async () => {
    if (!contextMenu || !user) return;
    
    try {
      const success = await removeFromFavorites(user.uid, contextMenu.favorite.speciesKey);
      
      if (success) {
        // Remove from local state
        setFavorites(prev => 
          prev.filter(fav => fav.speciesKey !== contextMenu.favorite.speciesKey)
        );
        
        Alert.alert(
          'Removed', 
          `Removed ${contextMenu.favorite.commonName || contextMenu.favorite.scientificName} from favorites`
        );
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      Alert.alert('Error', 'Failed to remove from favorites');
    }
    
    closeContextMenu();
  };

  // Handle view details
  const handleOpenDetails = () => {
    if (contextMenu) {
      router.push({
        pathname: '/DetailedDescription',
        params: {
          speciesKey: contextMenu.favorite.speciesKey,
          scientificName: contextMenu.favorite.scientificName
        }
      });
      closeContextMenu();
    }
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Entypo name="heart-outlined" size={80} color={Colors.light.tabIconDefault} />
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptyText}>
        Right-click on any species in the Home tab to add it to your favorites
      </Text>
    </View>
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.tint]}
            tintColor={Colors.light.tint}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Favorites</Text>
          <Text style={styles.headerSubtitle}>
            {favorites.length} {favorites.length === 1 ? 'species' : 'species'}
          </Text>
        </View>

        {favorites.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.gridContainer}>
            {favorites.map((item, index) => (
              <View 
                key={`${item.speciesKey}-${index}`} 
                style={styles.gridItem}
              >
                <Pressable 
                  onPress={() => handleSpeciesPress(item.speciesKey, item.scientificName)}
                  onLongPress={(e) => handleContextMenu(e, item)}
                >
                  {({hovered}) => (
                    <View 
                      style={[
                        styles.species_picture_container,
                        { width: item.calculatedWidth }
                      ]}
                      // @ts-ignore - onContextMenu is web-only
                      onContextMenu={(e) => handleContextMenu(e, item)}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.species_picture}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['rgba(0,0,0,0.9)', 'transparent']}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={[
                          styles.gradient,
                          hovered && styles.gradient_hovered
                        ]}
                      />
                      <View style={styles.speciesNameContainer}>
                        <Text style={styles.speciesName} numberOfLines={2}>
                          {item.commonName || item.scientificName}
                        </Text>
                      </View>
                      
                      {/* Favorite badge */}
                      <View style={styles.favoriteBadge}>
                        <AntDesign name="star" style={styles.Badge} />
                      </View>
                    </View>
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Context Menu */}
      {contextMenu?.visible && (
        <>
          <Pressable 
            style={styles.contextMenuBackdrop} 
            onPress={closeContextMenu}
          />
          <View 
            style={[
              styles.contextMenu,
              { top: contextMenu.y, left: contextMenu.x }
            ]}
          >
            <TouchableOpacity 
              style={styles.contextMenuItem}
              onPress={handleOpenDetails}
            >
              <Entypo name="eye" size={20} color={Colors.light.text} />
              <Text style={styles.contextMenuText}>View Details</Text>
            </TouchableOpacity>
            
            <View style={styles.contextMenuDivider} />
            
            <TouchableOpacity 
              style={[styles.contextMenuItem, styles.contextMenuItemDanger]}
              onPress={handleRemoveFromFavorites}
            >
              <Entypo name="trash" size={20} color="#e74c3c" />
              <Text style={[styles.contextMenuText, styles.contextMenuTextDanger]}>
                Remove from Favorites
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.selected,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 22,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  gridItem: {
    marginBottom: 15,
  },
  species_picture_container: {
    height: IMAGE_HEIGHT,
    marginHorizontal: 5,
    overflow: 'hidden',
    backgroundColor: Colors.light.background,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  species_picture: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  gradient_hovered: {
    height: '70%',
  },
  speciesNameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  speciesName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  Badge: {
    color: "#FFE924",
    fontSize: 16,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  contextMenu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 220,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  contextMenuItemDanger: {
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
  },
  contextMenuText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  contextMenuTextDanger: {
    color: '#e74c3c',
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  }
});