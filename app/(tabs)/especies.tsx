/**
 * SpeciesScreen
 * -------------
 * Pantalla encargada de:
 * - Leer el texto de búsqueda desde la URL (params.search)
 * - Escuchar cambios en los filtros (FilterContext)
 * - Ejecutar la búsqueda en GBIF
 * - Mostrar los resultados en formato galería (grid)
 */
import FilterOverlay from '@/components/FilterOverlay';
import Colors from '@/constants/Colors';
import { useFilters } from '@/context/FilterContext';
import { useTheme } from '@/context/ThemeContext';
import { gbifService, ImageItem } from '@/services/gbifService';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';

type GalleryItem = ImageItem & {
  calculatedHeight: number;
};

export default function SpeciesScreen() {
  const router = useRouter(); // Navegación entre pantallas
  const colorScheme = useColorScheme() ?? 'light'; // Modo claro / oscuro
  const params = useLocalSearchParams(); // Lee parámetros de la ruta (?search=...)
  const { width } = useWindowDimensions(); // Para diseño responsive

  // Obtenemos filtros y la función para cerrar el modal del contexto
  const { filters, setIsFilterVisible } = useFilters(); 

  const [results, setResults] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const numColumns = width > 1100 ? 5 : width > 700 ? 3 : 2;
  const COLUMN_WIDTH = width / numColumns - 20;

  /**
   * performSearch
   * -------------
   * Función central de búsqueda.
   * Recibe el texto (query) y usa los filtros desde el contexto.
   * Llama al servicio gbifService y transforma los resultados para la galería.
   */
  const performSearch = async (query: string) => { 
    setLoading(true);
    try {
      console.log("Enviando al servicio estos filtros:", filters);
      
      const images = await gbifService.searchOccurrencesByQuery(query, 0, filters);

      const processed = images.map((img) => ({
        ...img,
        calculatedHeight: 220,
      }));

      setResults(processed);
    } catch (e) {
      console.error('Error en búsqueda:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * useEffect
   * ---------
   * Se dispara cuando:
   * - cambia el texto de búsqueda
   * - cambian los filtros
   * 
   * Esto asegura que la búsqueda se actualice automáticamente.
   */
  useEffect(() => {
    if (params.search) {
      performSearch(params.search as string);
    }
  }, [params.search, filters]); 

  const {colors} = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>

      <FilterOverlay 
        onApply={() => {
          setIsFilterVisible(false);
          if (params.search) {
            performSearch(params.search as string);
          }
        }} 
      />

      <Text style={styles.title}>
        Resultados: {params.search}
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={results}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/DetailedDescription',
                  params: {
                    speciesKey: item.taxonKey,
                    scientificName: item.scientificName,
                  },
                })
              }
              style={({ pressed }) => [
                styles.card,
                {
                  height: item.calculatedHeight,
                  maxWidth: COLUMN_WIDTH,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <LinearGradient
                colors={['rgba(0,0,0,0.85)', 'transparent']}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0.4 }}
                style={styles.gradient}
              />
              <View style={styles.infoContainer}>
                <Text style={styles.scientificName} numberOfLines={2}>
                  {item.commonName || item.scientificName}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 10, 
    backgroundColor: colors.background,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginLeft: 20, 
    marginBottom: 15,
    color: colors.text,
  },
  listPadding: { 
    paddingHorizontal: 10, 
    paddingBottom: 30 
  },
  card: { 
    margin: 8, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: colors.background, 
    flex: 1 
  },
  image: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  gradient: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: '60%' 
  },
  infoContainer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 12 
  },
  scientificName: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '600' 
  },
});