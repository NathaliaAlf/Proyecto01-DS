import { useTheme } from '@/context/ThemeContext';
import { gbifService } from '@/services/gbifService';
import { GBIFCountry, Taxon } from '@/services/gbifTypes';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type ActiveTab = 'overview' | 'seasonality';

export default function DetailedDescriptionScreen() {
  const { speciesKey, scientificName } = useLocalSearchParams();
  const router = useRouter();
  
  // State for the active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Data states
  const [monthlyData, setMonthlyData] = useState<number[]>(new Array(12).fill(0));
  const [taxonomy, setTaxonomy] = useState<Taxon[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [countries, setCountries] = useState<GBIFCountry[]>([]);
  const [regionsByCountry, setRegionsByCountry] = useState<Map<string, Set<string>>>(new Map());

  // Loading states
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  
  // Error and interaction states
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  // Filter states
  const [selectedCountry, setSelectedCountry] = useState<GBIFCountry | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  // Modal UI states
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [regionSearch, setRegionSearch] = useState('');

  const {colors} = useTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    const key = Array.isArray(speciesKey) ? speciesKey[0] : speciesKey;
    if (key) {
      const numericKey = Number(key);
      loadInitialData(numericKey);
    }
  }, [speciesKey]);

  // Effect for refetching chart data when filters change
  useEffect(() => {
    const key = Array.isArray(speciesKey) ? speciesKey[0] : speciesKey;
    if (key) {
      fetchSeasonalityData(Number(key));
    }
  }, [selectedCountry, selectedRegion]);

  const loadInitialData = (key: number) => {
    loadVerifiedLocations(key);
    loadTaxonomy(key);
    loadImages(key);
    fetchSeasonalityData(key);
  };

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
      const imageList = await gbifService.getSpeciesImages(key, 3);
      setImages(imageList);
    } catch (err) {
      console.error("Error loading images", err);
    } finally {
      setLoadingImages(false);
    }
  };

  const fetchSeasonalityData = async (key: number) => {
    setLoadingChart(true);
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
      setLoadingChart(false);
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

  // --- Render Functions for each Tab ---

  const renderOverview = () => (
    <ScrollView>
      <View style={styles.section}>
        {loadingImages ? (
          <ActivityIndicator style={{height: 200}} color={colors.selected} />
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

        {loadingTaxonomy ? (
          <ActivityIndicator color={colors.selected} style={{marginTop: 20}}/>
        ) : (
          <View style={styles.taxonomySection}>
            <Text style={styles.sectionTitle}>Clasificación Taxonómica</Text>
            {taxonomy.map((taxon, index) => (
              <View key={index} style={[styles.taxonomyItem, { marginLeft: index * 10 }]}>
                <Text style={styles.taxonomyRank}>{taxon.rank}</Text>
                <Text style={styles.taxonomyName}>{taxon.canonicalName}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderSeasonality = () => (
    <ScrollView>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seasonality</Text>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>País:</Text>
          <View style={styles.selectorContainer}>
            {selectedCountry && (
              <TouchableOpacity style={styles.clearButton} onPress={() => { setSelectedCountry(null); setSelectedRegion(null); }}>
                <FontAwesome name="times-circle" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowCountryModal(true)}>
              <Text style={selectedCountry ? styles.dropdownText : styles.placeholderText} numberOfLines={1}>
                {loadingLocations ? "Cargando ubicaciones..." : (selectedCountry ? selectedCountry.title : "Todos los países (Global)")}
              </Text>
              <FontAwesome name="chevron-down" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.filterLabel}>Región (Opcional):</Text>
          <View style={styles.selectorContainer}>
            {selectedRegion && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setSelectedRegion(null)}>
                <FontAwesome name="times-circle" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.dropdownSelector, !selectedCountry && styles.disabledSelector]} onPress={() => selectedCountry && setShowRegionModal(true)} disabled={!selectedCountry}>
              <Text style={selectedRegion ? styles.dropdownText : styles.placeholderText} numberOfLines={1}>
                {selectedRegion || "Todas las regiones"}
              </Text>
              <FontAwesome name="chevron-down" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        {loadingChart ? (
          <ActivityIndicator size="large" color={colors.selected} style={{ marginVertical: 20 }} />
        ) : error ? (
          <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>
        ) : (
          <View style={styles.chartContainer}>
            <View style={styles.chartGrid}>
              {monthlyData.map((count, index) => (
                <Pressable key={index} style={styles.barContainer} onHoverIn={() => setSelectedMonth(index)} onHoverOut={() => setSelectedMonth(null)} onPress={() => setSelectedMonth(index === selectedMonth ? null : index)}>
                  {selectedMonth === index && <View style={styles.tooltip}><Text style={styles.tooltipText}>{count}</Text></View>}
                  <View style={[styles.bar, { height: `${(count / maxCount) * 100}%`, backgroundColor: selectedMonth === index ? colors.selected : '#3D7716', opacity: selectedMonth === index ? 1 : 0.7 }]} />
                  <Text style={[styles.monthLabel, selectedMonth === index && styles.monthLabelSelected]}>{monthNames[index]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color={colors.selected} />
        </TouchableOpacity>
        <Text style={styles.scientificName}>{scientificName}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]} onPress={() => setActiveTab('overview')}>
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Resumen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'seasonality' && styles.tabItemActive]} onPress={() => setActiveTab('seasonality')}>
          <Text style={[styles.tabText, activeTab === 'seasonality' && styles.tabTextActive]}>Estacionalidad</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'seasonality' && renderSeasonality()}
      </View>

      {/* --- Modals --- */}
      <Modal visible={showCountryModal} animationType="slide" transparent={true} onRequestClose={() => setShowCountryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar País</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} placeholder="Buscar país..." value={countrySearch} onChangeText={setCountrySearch} />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.iso2}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedCountry(item); setSelectedRegion(null); setShowCountryModal(false); }}>
                  <Text style={styles.modalItemText}>{item.title}</Text>
                  {selectedCountry?.iso2 === item.iso2 && <FontAwesome name="check" size={16} color={colors.selected} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyListText}>No hay países con registros verificados.</Text>}
            />
          </View>
        </View>
      </Modal>
      <Modal visible={showRegionModal} animationType="slide" transparent={true} onRequestClose={() => setShowRegionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Región</Text>
              <TouchableOpacity onPress={() => setShowRegionModal(false)}><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} placeholder="Buscar región..." value={regionSearch} onChangeText={setRegionSearch} />
            <FlatList
              data={filteredRegions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedRegion(item); setShowRegionModal(false); }}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedRegion === item && <FontAwesome name="check" size={16} color={colors.selected} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyListText}>No hay regiones para este país.</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  scientificName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.selected,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tabItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.selected,
  },
  tabText: {
    fontSize: 16,
    color: colors.text,
  },
  tabTextActive: {
    color: colors.selected,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
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
  taxonomySection: {
    marginTop: 10,
  },
  taxonomyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  taxonomyRank: {
    fontSize: 10,
    color: colors.text,
    textTransform: 'uppercase',
  },
  taxonomyName: {
    color: colors.selected,
    fontWeight: 'bold',
    fontSize: 16,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.selected,
  },
  chartContainer: {
    height: 220,
    backgroundColor: colors.background,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 10,
    paddingTop: 30,
  },
  chartGrid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20,
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
    minHeight: 2,
  },
  monthLabel: {
    fontSize: 9,
    marginTop: 5,
    color: colors.text,
    textAlign: 'center',
  },
  monthLabelSelected: {
    fontWeight: 'bold',
    color: colors.selected,
  },
  tooltip: {
    position: 'absolute',
    top: -25,
    backgroundColor: colors.selected,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  tooltipText: {
    color: colors.background,
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
    color: colors.selected,
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
    backgroundColor: colors.background,
  },
  disabledSelector: {
    backgroundColor: colors.divider,
    opacity: 0.7,
  },
  dropdownText: {
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.placeHolder,
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
    backgroundColor: colors.background,
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
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.selected,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 20,
  },
  searchInput: {
    height: 45,
    padding: 10,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
});
