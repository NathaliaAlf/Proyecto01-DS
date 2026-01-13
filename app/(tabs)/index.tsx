import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { addToFavorites, getFavorites, removeFromFavorites } from '@/services/favoritesService';
import { gbifService, ImageItem } from '@/services/gbifService';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

const IMAGE_HEIGHT = 150;
const sections = ["Animalia", "Fungi", "Plantae", "Mollusca", "Arthropoda", "Insecta", "Magnoliopsida", "Lepidoptera", "Coleoptera", "Tracheophyta"]

type SectionState = {
  [key: string]: boolean;
};

type ImageWithDimensions = ImageItem & {
  width?: number;
  height?: number;
  calculatedWidth: number;
};

type SectionLoadingMore = {
  [key: string]: boolean;
};

type SectionOffset = {
  [key: string]: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768; // Hide arrows on screens smaller than 768px
  
  const [imagesBySection, setImagesBySection] = useState<Record<string, ImageWithDimensions[]>>({});
  const [loadingStates, setLoadingStates] = useState<SectionState>({});
  const [loadingMoreStates, setLoadingMoreStates] = useState<SectionLoadingMore>({});
  const [offsetBySection, setOffsetBySection] = useState<SectionOffset>({});
  const [favoriteKeys, setFavoriteKeys] = useState<Set<number>>(new Set());
  const { colors } = useTheme();
  const styles = makeStyles(colors, screenWidth);

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
  const flatListRefs = useRef<Record<string, FlatList<any> | null>>({});

  function getIcon(name: string){
    const iconSize = screenWidth < 375 ? 28 : 35;
    switch(name){
      case "Animalia": return <MaterialCommunityIcons name="dog-side" size={iconSize} color={colors.selected} />
      case "Fungi":  return <MaterialCommunityIcons name="mushroom" size={iconSize} color={colors.selected} />
      case "Plantae": return <Entypo name="flower" size={iconSize} color={colors.selected} />
      case "Mollusca": return <MaterialCommunityIcons name="snail" size={iconSize} color={colors.selected} />
      case "Arthropoda": return <MaterialCommunityIcons name="spider" size={iconSize} color={colors.selected} />
      case "Insecta": return <FontAwesome6 name="mosquito" size={iconSize} color={colors.selected} />
      case "Magnoliopsida": return <Ionicons name="flower-sharp" size={iconSize} color={colors.selected} />
      case "Lepidoptera": return <MaterialCommunityIcons name="butterfly" size={iconSize} color={colors.selected} />
      case "Coleoptera": return <Ionicons name="bug-sharp" size={iconSize} color={colors.selected} />
      case "Tracheophyta": return <MaterialCommunityIcons name="forest" size={iconSize} color={colors.selected} />
      default: return null;
    }
  }
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

  // Process images to calculate their width
  const processImages = async (images: ImageItem[]): Promise<ImageWithDimensions[]> => {
    return await Promise.all(
      images.map(async (img) => {
        try {
          return await new Promise<ImageWithDimensions>((resolve) => {
            Image.getSize(
              img.imageUrl,
              (imgWidth, imgHeight) => {
                const aspectRatio = imgWidth / imgHeight;
                const calculatedWidth = IMAGE_HEIGHT * aspectRatio;
                
                resolve({
                  ...img,
                  width: imgWidth,
                  height: imgHeight,
                  calculatedWidth: Math.max(calculatedWidth, 60)
                });
              },
              (error) => {
                console.error(`Failed to get size for ${img.scientificName}:`, error);
                resolve({
                  ...img,
                  calculatedWidth: IMAGE_HEIGHT
                });
              }
            );
          });
        } catch (error) {
          console.error('Error processing image:', error);
          return {
            ...img,
            calculatedWidth: IMAGE_HEIGHT
          };
        }
      })
    );
  };

  // Initial load
  useEffect(() => {
    const loadImages = async () => {
      const newLoadingStates: SectionState = {};
      const newOffsets: SectionOffset = {};
      
      sections.forEach(section => {
        newLoadingStates[section] = true;
        newOffsets[section] = 0;
      });
      
      setLoadingStates(newLoadingStates);
      setOffsetBySection(newOffsets);

      const results: Record<string, ImageWithDimensions[]> = {};

      for (const section of sections) {
        const images = await gbifService.getTaxonGroupImages(section, 0);
        const processedImages = await processImages(images);
        
        results[section] = processedImages;
        setLoadingStates(prev => ({ ...prev, [section]: false }));
        setOffsetBySection(prev => ({ ...prev, [section]: 100 }));
      }

      setImagesBySection(results);
    };

    loadImages();
  }, []);

  // Load more images for a specific section
  const loadMoreImages = async (section: string) => {
    if (loadingMoreStates[section]) {
      return;
    }

    setLoadingMoreStates(prev => ({ ...prev, [section]: true }));

    try {
      const currentOffset = offsetBySection[section] || 0;
      const newImages = await gbifService.getTaxonGroupImages(section, currentOffset);
      
      if (newImages.length === 0) {
        setLoadingMoreStates(prev => ({ ...prev, [section]: false }));
        return;
      }
      
      const processedNewImages = await processImages(newImages);
      
      const existingKeys = new Set(
        imagesBySection[section]?.map(img => img.taxonKey) || []
      );
      
      const uniqueNewImages = processedNewImages.filter(
        img => !existingKeys.has(img.taxonKey)
      );

      if (uniqueNewImages.length > 0) {
        setImagesBySection(prev => ({
          ...prev,
          [section]: [...(prev[section] || []), ...uniqueNewImages]
        }));
        
        setOffsetBySection(prev => ({
          ...prev,
          [section]: currentOffset + 100
        }));
      } else {
        setOffsetBySection(prev => ({
          ...prev,
          [section]: currentOffset + 100
        }));
      }
    } catch (error) {
      console.error(`Error loading more images for ${section}:`, error);
    } finally {
      setLoadingMoreStates(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleImageError = (section: string, index: number) => {
    console.log(`Failed to load image for ${section} at index ${index}`);
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
        // Remove from favorites
        const success = await removeFromFavorites(user.uid, contextMenu.speciesKey);
        
        if (success) {
          setFavoriteKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(contextMenu.speciesKey);
            return newSet;
          });
          
          Alert.alert(
            'Removed', 
            `Removed ${contextMenu.commonName || contextMenu.scientificName} from favorites`
          );
        }
      } else {
        // Add to favorites
        const success = await addToFavorites(user.uid, {
          speciesKey: contextMenu.speciesKey,
          scientificName: contextMenu.scientificName,
          commonName: contextMenu.commonName,
          imageUrl: contextMenu.imageUrl
        });

        if (success) {
          setFavoriteKeys(prev => new Set(prev).add(contextMenu.speciesKey));
          
          Alert.alert(
            'Success!', 
            `Added ${contextMenu.commonName || contextMenu.scientificName} to favorites`
          );
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
      router.push({
        pathname: '/DetailedDescription',
        params: {
          speciesKey: contextMenu.speciesKey,
          scientificName: contextMenu.scientificName
        }
      });
      closeContextMenu();
    }
  };

  const renderFooter = (section: string) => {
    if (!loadingMoreStates[section]) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((element, index) => (
          <View key={index} style={styles.sectionContainer}>
            <View style={styles.section_title_container}>
              {getIcon(element)}
              <Pressable>
                {({ hovered }) => (
                  <Text
                    style={[
                      styles.section_title,
                      hovered && styles.section_title_hovered,
                    ]}
                  >
                    {element}
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.section}>
              {/* Left arrow - only show on larger screens */}
              {!isMobile && (
                <TouchableOpacity
                  style={styles.arrow_container}
                  onPress={() =>
                    flatListRefs.current[element]?.scrollToOffset({
                      offset: 0,
                      animated: true,
                    })
                  }
                >
                  <Entypo name="chevron-thin-left" style={styles.arrow} />
                </TouchableOpacity>
              )}

              <View style={[
                styles.species_pics_row_container,
                // Adjust container width based on arrow visibility
                !isMobile && { marginHorizontal: 0 }
              ]}>
                {loadingStates[element] ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.tint} />
                  </View>
                ) : (
                  <FlatList
                    horizontal
                    data={imagesBySection[element] ?? []}
                    keyExtractor={(item) => item.id}
                    ref={(ref) => {
                      if (ref) {
                        flatListRefs.current[element] = ref;
                      }
                    }}
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.flatListContent}
                    onEndReached={() => loadMoreImages(element)}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No images available</Text>
                      </View>
                    }
                    ListFooterComponent={renderFooter(element)}
                    renderItem={({ item, index }) => {
                      const isFavorite = favoriteKeys.has(item.taxonKey);
                      
                      return (
                        <View>
                          <Pressable 
                            onPress={() => handleSpeciesPress(item.taxonKey, item.scientificName)}
                            onLongPress={(e) => handleContextMenu(e, item.taxonKey, item.scientificName, item.commonName, item.imageUrl)}
                          >
                            {({hovered}) => (
                              <View 
                                style={[
                                  styles.species_picture_container,
                                  { width: item.calculatedWidth }
                                ]}
                                // @ts-ignore - onContextMenu is web-only
                                onContextMenu={(e) => handleContextMenu(e, item.taxonKey, item.scientificName, item.commonName, item.imageUrl)}
                              >
                                <Image
                                  source={{ uri: item.imageUrl }}
                                  style={styles.species_picture}
                                  resizeMode="cover"
                                  onError={() => handleImageError(element, index)}
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
                                {isFavorite && (
                                  <View style={styles.favoriteBadge}>
                                    <AntDesign name="star" size={screenWidth < 375 ? 14 : 16} color="#FFE924" />
                                  </View>
                                )}
                              </View>
                            )}
                          </Pressable>
                        </View>
                      );
                    }}
                  />
                )}
              </View>

              {/* Right arrow - only show on larger screens */}
              {!isMobile && (
                <TouchableOpacity
                  style={styles.arrow_container}
                  onPress={() =>
                    flatListRefs.current[element]?.scrollToEnd({
                      animated: true,
                    })
                  }
                >
                  <Entypo name="chevron-thin-right" style={styles.arrow} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
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
              { top: contextMenu.y, left: Math.min(contextMenu.x, screenWidth - 250) }
            ]}
          >
            <TouchableOpacity 
              style={styles.contextMenuItem}
              onPress={handleOpenDetails}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.text} />
              <Text style={styles.contextMenuText}>View Details</Text>
            </TouchableOpacity>
            
            <View style={styles.contextMenuDivider} />
            
            <TouchableOpacity 
              style={[
                styles.contextMenuItem,
                contextMenu.isFavorite && styles.contextMenuItemDanger
              ]}
              onPress={handleToggleFavorite}
            >
              <Ionicons 
                name={contextMenu.isFavorite ? "trash" : "heart-outline"} 
                size={20} 
                color={contextMenu.isFavorite ? "#e74c3c" : colors.text} 
              />
              <Text 
                style={[
                  styles.contextMenuText,
                  contextMenu.isFavorite && styles.contextMenuTextDanger
                ]}
              >
                {contextMenu.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: any, screenWidth: number) =>
StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 120,
  },
  section_icon: {
    fontSize: 35,
    color: colors.selected,
    marginTop: "auto",
    marginBottom: "auto",
    marginRight: 10
  },
  content: {
    flex: 1,
  },
  section_title_container: {
    flexDirection: "row",
    marginHorizontal: screenWidth < 375 ? 20 : screenWidth < 414 ? 24 : 30, // Responsive horizontal margins
    marginVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: colors.divider,
    alignItems: "center",
    paddingBottom: 10,
  },
  section_title: {
    fontSize: screenWidth < 375 ? 28 : screenWidth < 414 ? 32 : 35,
    fontWeight: "600",
    color: colors.selected,
    marginLeft: 10,
  },
  section_title_hovered: {
    textDecorationLine: "underline"
  },
  species_pics_row_container: {
    flex: 1,
    height: IMAGE_HEIGHT,
    marginVertical: 10,
  },
  species_picture_container: {
    height: IMAGE_HEIGHT,
    marginHorizontal: 6,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    fontSize: screenWidth < 375 ? 11 : 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: screenWidth < 375 ? 26 : 30,
    height: screenWidth < 375 ? 26 : 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: screenWidth < 375 ? 13 : 15,
  },
  arrow: {
    fontSize: screenWidth < 414 ? 36 : 40,
    color: colors.selected,
  },
  arrow_container: {
    width: screenWidth < 414 ? 80 : 100,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  flatListContent: {
    paddingHorizontal: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: IMAGE_HEIGHT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: IMAGE_HEIGHT,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: colors.tabIconDefault,
    fontStyle: "italic",
  },
  footerLoader: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    minWidth: 200,
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
  }
});