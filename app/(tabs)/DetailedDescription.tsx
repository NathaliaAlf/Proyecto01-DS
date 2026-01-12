import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Modal, FlatList, TextInput, Image } from 'react-native';
import { gbifService } from '@/services/gbifService';
import { GBIFCountry, Taxon } from '@/services/gbifTypes';

export default function DetailedDescriptionScreen() {
  const { speciesKey, scientificName } = useLocalSearchParams();
  const router = useRouter();
  const [monthlyData, setMonthlyData] = useState<number[]>(new Array(12).fill(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  // Taxonomy state
  const [taxonomy, setTaxonomy] = useState<Taxon[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  // Image gallery state
  const [images, setImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  // Filter states
  const [countries, setCountries] = useState<GBIFCountry[]>([]);
  const [regionsByCountry, setRegionsByCountry] = useState<Map<string, Set<string>>>(new Map());
  const [selectedCountry, setSelectedCountry] = useState<GBIFCountry | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  // UI states for dropdowns
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [countrySearch, setCountrySearch] = useState('');
  const [regionSearch, setRegionSearch] = useState('');

  useEffect(() => {
    const key = Array.isArray(speciesKey) ? speciesKey[0] : speciesKey;
    if (key) {
      const numericKey = Number(key);
      loadVerifiedLocations(numericKey);
      loadTaxonomy(numericKey);
      loadImages(numericKey);
      fetchSeasonalityData(numericKey);
    }
  }, [speciesKey]);

  // Effect for refetching chart data when filters change
  useEffect(() => {
    const key = Array.isArray(speciesKey) ? speciesKey[0] : speciesKey;
    if (key) {
      fetchSeasonalityData(Number(key));
    }
  }, [selectedCountry, selectedRegion]);

  const loadVerifiedLocations = async (key: number) => {
    setLoadingLocations(true);
    try {
      const { countries: verifiedCountries, regionsByCountry: verifiedRegions } = await gbifService.getVerifiedLocations(key);
      verifiedCountries.sort((a, b) => a.title.localeCompare(b.title));
      setCountries(verifiedCountries);
      setRegionsByCountry(verifiedRegions);
    } catch (err) {
      console.error("Error loading verified locations", err);
      setError("No se pudieron cargar los datos de ubicación para esta especie.");
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadTaxonomy = async (key: number) => {
    setLoadingTaxonomy(true);
    try {
      const hierarchy = await gbifService.getTaxonomicHierarchy(key);
      setTaxonomy(hierarchy);
    } catch (err) {
      console.error("Error loading taxonomy", err);
    } finally {
      setLoadingTaxonomy(false);
    }
  };

  const loadImages = async (key: number) => {
    setLoadingImages(true);
    try {
      const imageList = await gbifService.getSpeciesImages(key, 3); // Fetch up to 3 images
      setImages(imageList);
    } catch (err) {
      console.error("Error loading images", err);
    } finally {
      setLoadingImages(false);
    }
  };

  const fetchSeasonalityData = async (key: number) => {
    setLoading(true);
    setError(null);
    try {
      const countryIso = selectedCountry?.iso2;
      const regionName = selectedRegion || undefined;
      const data = await gbifService.getMonthlyOccurrences(key, countryIso, regionName);
      
      const monthCounts = new Array(12).fill(0);
      if (data.facets && data.facets[0] && data.facets[0].counts) {
        data.facets[0].counts.forEach((item: { name: string, count: number }) => {
          const monthIndex = parseInt(item.name) - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            monthCounts[monthIndex] = item.count;
          }
        });
      }
      setMonthlyData(monthCounts);
    } catch (err) {
      console.error(err);
      setError("Error al cargar datos de estacionalidad");
      setMonthlyData(new Array(12).fill(0));
    } finally {
      setLoading(false);
    }
  };

  const availableRegions = useMemo(() => {
    if (!selectedCountry) return [];
    const regions = regionsByCountry.get(selectedCountry.iso2);
    return regions ? Array.from(regions).sort() : [];
  }, [selectedCountry, regionsByCountry]);

  const filteredCountries = useMemo(() => {
    return countries.filter(c => c.title.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countries, countrySearch]);

  const filteredRegions = useMemo(() => {
    return availableRegions.filter(r => r.toLowerCase().includes(regionSearch.toLowerCase()));
  }, [availableRegions, regionSearch]);

  const maxCount = Math.max(...monthlyData, 1);
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Pantalla 1: Detalle de la Especie y Taxonomía */}
        <View style={styles.section}>
          <View style={styles.titleContainer}>
             <TouchableOpacity onPress={() => router.back()}>
               <FontAwesome name="arrow-left" size={20} color="#1A4508" />
             </TouchableOpacity>
             <Text style={styles.scientificName}>{scientificName}</Text>
          </View>

          {loadingImages ? (
            <ActivityIndicator style={{height: 200}} color="#1A4508" />
          ) : (
            <View style={styles.galleryContainer}>
              <View style={styles.galleryImageSmall}>
                {images[1] && <Image source={{ uri: images[1] }} style={styles.image} />}
              </View>
              <View style={styles.galleryImageLarge}>
                {images[0] ? (
                  <Image source={{ uri: images[0] }} style={styles.image} />
                ) : (
                  <View style={styles.noImage}>
                    <Text style={styles.noImageText}>No Image Available</Text>
                  </View>
                )}
              </View>
              <View style={styles.galleryImageSmall}>
                {images[2] && <Image source={{ uri: images[2] }} style={styles.image} />}
              </View>
            </View>
          )}

          {/* Taxonomy */}
          {loadingTaxonomy ? (
            <ActivityIndicator color="#1A4508" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taxonomyContainer}>
              {taxonomy.map((taxon, index) => (
                <View key={index} style={styles.taxonomyItem}>
                  <Text style={styles.taxonomyRank}>{taxon.rank}</Text>
                  <Text style={styles.taxonomyName}>{taxon.canonicalName}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Pantalla 2: Mapa de Distribución */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Distribution Map</Text>
           <View style={styles.mapContainer}>
              <Text>Map of Central America (Guatemala, Honduras, El Salvador, Nicaragua)</Text>
              <View style={[styles.pin, {top: 50, left: 100}]} />
              <View style={[styles.pin, {top: 80, left: 120}]} />
              <View style={[styles.pin, {top: 60, left: 150}]} />
              <View style={[styles.pin, {top: 90, left: 130}]} />
           </View>
        </View>

        {/* Pantalla 3: Gráfico de Estacionalidad y Filtros */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Seasonality</Text>
           
           <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>País:</Text>
              <View style={styles.selectorContainer}>
                {selectedCountry && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => {
                      setSelectedCountry(null);
                      setSelectedRegion(null);
                    }}
                  >
                    <FontAwesome name="times-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.dropdownSelector}
                  onPress={() => setShowCountryModal(true)}
                >
                  <Text style={selectedCountry ? styles.dropdownText : styles.placeholderText} numberOfLines={1}>
                    {loadingLocations ? "Cargando ubicaciones..." : (selectedCountry ? selectedCountry.title : "Todos los países (Global)")}
                  </Text>
                  <FontAwesome name="chevron-down" size={14} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Región (Opcional):</Text>
              <View style={styles.selectorContainer}>
                {selectedRegion && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => setSelectedRegion(null)}
                  >
                    <FontAwesome name="times-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.dropdownSelector, !selectedCountry && styles.disabledSelector]}
                  onPress={() => selectedCountry && setShowRegionModal(true)}
                  disabled={!selectedCountry}
                >
                  <Text style={selectedRegion ? styles.dropdownText : styles.placeholderText} numberOfLines={1}>
                    {selectedRegion || "Todas las regiones"}
                  </Text>
                  <FontAwesome name="chevron-down" size={14} color="#666" />
                </TouchableOpacity>
              </View>
           </View>

           {loading ? (
             <ActivityIndicator size="large" color="#1A4508" style={{ marginVertical: 20 }} />
           ) : error ? (
             <View style={styles.errorContainer}>
               <Text style={styles.errorText}>{error}</Text>
             </View>
           ) : (
             <View style={styles.chartContainer}>
                <View style={styles.chartGrid}>
                   {monthlyData.map((count, index) => {
                     const isSelected = selectedMonth === index;
                     return (
                       <Pressable 
                         key={index} 
                         style={styles.barContainer}
                         onHoverIn={() => setSelectedMonth(index)}
                         onHoverOut={() => setSelectedMonth(null)}
                         onPress={() => setSelectedMonth(isSelected ? null : index)}
                       >
                         {isSelected && (
                           <View style={styles.tooltip}>
                             <Text style={styles.tooltipText}>{count}</Text>
                           </View>
                         )}
                         <View 
                           style={[
                             styles.bar, 
                             { 
                               height: `${(count / maxCount) * 100}%`,
                               backgroundColor: isSelected ? '#1A4508' : '#3D7716',
                               opacity: isSelected ? 1 : 0.7
                             }
                           ]} 
                         />
                         <Text style={[
                           styles.monthLabel,
                           isSelected && styles.monthLabelSelected
                         ]}>
                           {monthNames[index]}
                         </Text>
                       </Pressable>
                     );
                   })}
                </View>
             </View>
           )}
        </View>
        <View style={{height: 50}} />
      </ScrollView>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar País</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <FontAwesome name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar país..."
              value={countrySearch}
              onChangeText={setCountrySearch}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.iso2}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setSelectedRegion(null); // Reset region when country changes
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.title}</Text>
                  {selectedCountry?.iso2 === item.iso2 && (
                    <FontAwesome name="check" size={16} color="#1A4508" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No hay países con registros verificados para esta especie.</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Region Selection Modal */}
      <Modal
        visible={showRegionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRegionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Región</Text>
              <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                <FontAwesome name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar región..."
              value={regionSearch}
              onChangeText={setRegionSearch}
            />
            <FlatList
              data={filteredRegions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedRegion(item);
                    setShowRegionModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedRegion === item && (
                    <FontAwesome name="check" size={16} color="#1A4508" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No hay regiones con registros para este país y especie.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scientificName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A4508',
    marginLeft: 10,
    fontStyle: 'italic',
  },
  galleryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 200,
    marginBottom: 20,
  },
  galleryImageSmall: {
    width: '20%',
    height: '80%',
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  galleryImageLarge: {
    width: '55%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontStyle: 'italic',
  },
  taxonomyContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  taxonomyItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  taxonomyRank: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
  taxonomyName: {
    color: '#1A4508',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1A4508',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pin: {
    position: 'absolute',
    width: 15,
    height: 15,
    backgroundColor: '#3D7716',
    borderRadius: 7.5,
    borderWidth: 2,
    borderColor: '#1B1C1A',
  },
  chartContainer: {
    height: 220, // Increased height for tooltips
    backgroundColor: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 10,
    paddingTop: 30, // Space for tooltips
  },
  chartGrid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20, // Space for labels
  },
  barContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
    position: 'relative',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2, // Ensure even 0 values have a tiny line
  },
  monthLabel: {
    fontSize: 9,
    marginTop: 5,
    color: '#666',
    textAlign: 'center',
  },
  monthLabelSelected: {
    fontWeight: 'bold',
    color: '#1A4508',
  },
  tooltip: {
    position: 'absolute',
    top: -25,
    backgroundColor: '#1A4508',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#d9534f',
    textAlign: 'center',
  },
  filterSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  filterLabel: {
    fontWeight: 'bold',
    color: '#1B1C1A',
    marginBottom: 5,
    marginTop: 10,
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownSelector: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  disabledSelector: {
    backgroundColor: '#eee',
    opacity: 0.7,
  },
  dropdownText: {
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
    flex: 1,
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A4508',
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  searchInput: {
    height: 45,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
});
