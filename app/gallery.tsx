// app/gallery.tsx
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { addToFavorites, getFavorites, removeFromFavorites } from '@/services/favoritesService';
import { gbifService, ImageItem } from '@/services/gbifService';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

const IMAGE_SIZE = 200;

type ImageWithDimensions = ImageItem & {
  calculatedWidth: number;
};

export default function GalleryScreen() {
  const router = useRouter();
  const { taxonName } = useLocalSearchParams<{ taxonName: string }>();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = makeStyles(colors, screenWidth);

  const [images, setImages] = useState<ImageWithDimensions[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<number>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    speciesKey: number;
    scientificName: string;
    commonName?: string;
    imageUrl: string;
    isFavorite: boolean;
  } | null>(null);

  // Calculate number of columns based on screen width
  const numColumns = Math.floor(screenWidth / IMAGE_SIZE);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavoriteKeys(new Set());
        return;
      }
      
      try {
        const favs = await getFavorites(user.uid);
        const keys = new Set(favs.map(fav => fav.speciesKey));
        setFavoriteKeys(keys);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadFavorites();
  }, [user]);

  // Process images
  const processImages = async (images: ImageItem[]): Promise<ImageWithDimensions[]> => {
    return await Promise.all(
      images.map(async (img) => {
        try {
          return await new Promise<ImageWithDimensions>((resolve) => {
            Image.getSize(
              img.imageUrl,
              (imgWidth, imgHeight) => {
                const aspectRatio = imgWidth / imgHeight;
                const calculatedWidth = IMAGE_SIZE * aspectRatio;
                
                resolve({
                  ...img,
                  calculatedWidth: Math.max(calculatedWidth, 100)
                });
              },
              (error) => {
                console.error(`Failed to get size for ${img.scientificName}:`, error);
                resolve({
                  ...img,
                  calculatedWidth: IMAGE_SIZE
                });
              }
            );
          });
        } catch (error) {
          console.error('Error processing image:', error);
          return {
            ...img,
            calculatedWidth: IMAGE_SIZE
          };
        }
      })
    );
  };

  // Initial load
  useEffect(() => {
    const loadImages = async () => {
      if (!taxonName) return;
      
      try {
        setLoading(true);
        const fetchedImages = await gbifService.getTaxonGroupImages(taxonName, 0);
        const processedImages = await processImages(fetchedImages);
        setImages(processedImages);
        setOffset(100);
      } catch (error) {
        console.error('Error loading gallery images:', error);
        Alert.alert('Error', 'Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [taxonName]);

  // Load more
  const loadMore = async () => {
    if (loadingMore || !taxonName) return;

    try {
      setLoadingMore(true);
      const newImages = await gbifService.getTaxonGroupImages(taxonName, offset);
      
      if (newImages.length === 0) {
        setLoadingMore(false);
        return;
      }

      const processedNewImages = await processImages(newImages);
      
      const existingKeys = new Set(images.map(img => img.taxonKey));
      const uniqueNewImages = processedNewImages.filter(
        img => !existingKeys.has(img.taxonKey)
      );

      if (uniqueNewImages.length > 0) {
        setImages(prev => [...prev, ...uniqueNewImages]);
        setOffset(prev => prev + 100);
      } else {
        setOffset(prev => prev + 100);
      }
    } catch (error) {
      console.error('Error loading more images:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSpeciesPress = (speciesKey: number, scientificName: string) => {
    router.push({
      pathname: '/DetailedDescription',
      params: {
        speciesKey: speciesKey,
        scientificName: scientificName
      }
    });
  };

  const handleContextMenu = (event: any, speciesKey: number, scientificName: string, commonName: string | undefined, imageUrl: string) => {
    event.preventDefault();
    const isFavorite = favoriteKeys.has(speciesKey);
    
    setContextMenu({
      visible: true,
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
      speciesKey,
      scientificName,
      commonName,
      imageUrl,
      isFavorite
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleToggleFavorite = async () => {
    if (!contextMenu || !user) {
      if (!user) {
        Alert.alert('Login Required', 'Please log in to manage favorites');
      }
      closeContextMenu();
      return;
    }

    try {
      if (contextMenu.isFavorite) {
        const success = await removeFromFavorites(user.uid, contextMenu.speciesKey);
        
        if (success) {
          setFavoriteKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(contextMenu.speciesKey);
            return newSet;
          });
          
          Alert.alert('Removed', `Removed ${contextMenu.commonName || contextMenu.scientificName} from favorites`);
        }
      } else {
        const success = await addToFavorites(user.uid, {
          speciesKey: contextMenu.speciesKey,
          scientificName: contextMenu.scientificName,
          commonName: contextMenu.commonName,
          imageUrl: contextMenu.imageUrl
        });

        if (success) {
          setFavoriteKeys(prev => new Set(prev).add(contextMenu.speciesKey));
          Alert.alert('Success!', `Added ${contextMenu.commonName || contextMenu.scientificName} to favorites`);
        } else {
          Alert.alert('Already Added', 'This species is already in your favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    }
    
    closeContextMenu();
  };

  const handleOpenDetails = () => {
    if (contextMenu) {
      handleSpeciesPress(contextMenu.speciesKey, contextMenu.scientificName);
      closeContextMenu();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{taxonName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Gallery Grid */}
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.gridContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isFavorite = favoriteKeys.has(item.taxonKey);
          
          return (
            <Pressable
              onPress={() => handleSpeciesPress(item.taxonKey, item.scientificName)}
              onLongPress={(e) => handleContextMenu(e, item.taxonKey, item.scientificName, item.commonName, item.imageUrl)}
              style={styles.gridItem}
            >
              {({ hovered }) => (
                <View
                  style={styles.imageContainer}
                  // @ts-ignore - onContextMenu is web-only
                  onContextMenu={(e) => handleContextMenu(e, item.taxonKey, item.scientificName, item.commonName, item.imageUrl)}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'transparent']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[styles.gradient, hovered && styles.gradientHovered]}
                  />
                  <View style={styles.nameContainer}>
                    <Text style={styles.speciesName} numberOfLines={2}>
                      {item.commonName || item.scientificName}
                    </Text>
                  </View>
                  
                  {isFavorite && (
                    <View style={styles.favoriteBadge}>
                      <AntDesign name="star" size={16} color="#FFE924" />
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          );
        }}
      />

      {/* Context Menu */}
      {contextMenu?.visible && (
        <>
          <Pressable style={styles.contextMenuBackdrop} onPress={closeContextMenu} />
          <View style={[styles.contextMenu, { top: contextMenu.y, left: Math.min(contextMenu.x, screenWidth - 250) }]}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={handleOpenDetails}>
              <Ionicons name="information-circle-outline" size={20} color={colors.text} />
              <Text style={styles.contextMenuText}>View Details</Text>
            </TouchableOpacity>
            
            <View style={styles.contextMenuDivider} />
            
            <TouchableOpacity 
              style={[styles.contextMenuItem, contextMenu.isFavorite && styles.contextMenuItemDanger]}
              onPress={handleToggleFavorite}
            >
              <Ionicons 
                name={contextMenu.isFavorite ? "trash" : "heart-outline"} 
                size={20} 
                color={contextMenu.isFavorite ? "#e74c3c" : colors.text} 
              />
              <Text style={[styles.contextMenuText, contextMenu.isFavorite && styles.contextMenuTextDanger]}>
                {contextMenu.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: any, screenWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  gridContent: {
    padding: 10,
  },
  gridItem: {
    flex: 1 / Math.floor(screenWidth / IMAGE_SIZE),
    aspectRatio: 1,
    padding: 5,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
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
  gradientHovered: {
    height: '70%',
  },
  nameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  speciesName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
  },
  footerLoader: {
    paddingVertical: 20,
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
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
    color: colors.text,
    fontWeight: '500',
  },
  contextMenuTextDanger: {
    color: '#e74c3c',
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
});