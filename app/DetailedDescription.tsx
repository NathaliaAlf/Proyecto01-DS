import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FilterContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { gbifService } from '@/services/gbifService';
import { GBIFCountry, Taxon } from '@/services/gbifTypes';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions
} from 'react-native';

type ActiveTab = 'overview' | 'seasonality';

export default function DetailedDescriptionScreen() {
  const { speciesKey, scientificName } = useLocalSearchParams();
  const router = useRouter();

  // Header states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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

  // Hooks
  const { colors, theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useLanguage();
  const { user, logout } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const { filters, setIsFilterVisible } = useFilters();
  const styles = makeStyles(colors);

  // Refs
  const searchInputRef = useRef<TextInput>(null);
  const profileButtonRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);
  const languageButtonRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);

  const SIDE_ELEMENTS_WIDTH = 400;
  const availableWidth = Math.max(screenWidth - SIDE_ELEMENTS_WIDTH, 100);

  useEffect(() => {
    const key = Array.isArray(speciesKey) ? speciesKey[0] : speciesKey;
    if (key) {
      const numericKey = Number(key);
      loadInitialData(numericKey);
    }
  }, [speciesKey]);

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

  // --- Header Handlers ---
  const handleHeaderSearch = async () => {
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;
    
    setIsSearching(true);
    try {
      router.push({
        pathname: '/especies',
        params: { 
          search: cleanQuery,
          ...filters
        }
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setTimeout(() => setIsSearching(false), 500);
      searchInputRef.current?.blur();
    }
  };
  
  const handleLogoPress = () => {
    router.push({ pathname: '/(tabs)' });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleProfilePress = () => {
    (profileButtonRef.current as any)?.measure(
      (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setMenuPosition({ x: pageX - 160, y: pageY + height + 5 });
        setShowProfileMenu(true);
      }
    );
  };

  const handleLanguagePress = () => {
    (languageButtonRef.current as any)?.measure(
        (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          setMenuPosition({ x: pageX - 160, y: pageY + height + 5 });
          setShowLanguageMenu(true);
        }
    );
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    try {
      await logout();
      await new Promise(resolve => setTimeout(resolve, 500));
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const closeAllMenus = () => {
    setShowProfileMenu(false);
    setShowLanguageMenu(false);
  };
  
  const changeLanguage = (newLocale: string) => {
    setLocale(newLocale);
    setShowLanguageMenu(false);
  };

  // --- Data Loading ---
  const loadVerifiedLocations = async (key: number) => {
    setLoadingLocations(true);
    try {
      const { countries: verifiedCountries, regionsByCountry: verifiedRegions } = await gbifService.getVerifiedLocations(key);
      verifiedCountries.sort((a, b) => a.title.localeCompare(b.title));
      setCountries(verifiedCountries);
      setRegionsByCountry(verifiedRegions);
    } catch (err) {
      console.error("Error loading verified locations", err);
      setError(t('errorLoadingSeasonality'));
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
      setError(t('errorLoadingSeasonality'));
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
  const monthNames = useMemo(() => [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
  ], [locale]);

  // --- Render Functions ---
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
                  <Text style={styles.noImageText}>{t('noImage')}</Text>
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
            <Text style={styles.sectionTitle}>{t('taxonomy')}</Text>
            {taxonomy.map((taxon, index) => (
              <View key={index} style={[styles.taxonomyItem, { marginLeft: index * 10 }]}>
                <Text style={styles.taxonomyRank}>{t(taxon.rank.toUpperCase())}</Text>
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
        <Text style={styles.sectionTitle}>{t('seasonality')}</Text>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t('country')}</Text>
          <View style={styles.selectorContainer}>
            {selectedCountry && (
              <TouchableOpacity style={styles.clearButton} onPress={() => { setSelectedCountry(null); setSelectedRegion(null); }}>
                <FontAwesome name="times-circle" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowCountryModal(true)}>
              <Text style={selectedCountry ? styles.dropdownText : styles.placeholderText} numberOfLines={1}>
                {loadingLocations ? t('loadingLocations') : (selectedCountry ? selectedCountry.title : t('allCountries'))}
              </Text>
              <FontAwesome name="chevron-down" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.filterLabel}>{t('region')}</Text>
          <View style={styles.selectorContainer}>
            {selectedRegion && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setSelectedRegion(null)}>
                <FontAwesome name="times-circle" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.dropdownSelector, !selectedCountry && styles.disabledSelector]} onPress={() => selectedCountry && setShowRegionModal(true)} disabled={!selectedCountry}>
              <Text style={selectedRegion ? styles.dropdownText : styles.placeholderText} numberOfLines={1}>
                {selectedRegion || t('allRegions')}
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

  const ProfileMenu = () => (
    <Modal transparent={true} visible={showProfileMenu} animationType="fade" onRequestClose={closeAllMenus}>
      <TouchableWithoutFeedback onPress={closeAllMenus}>
        <View style={styles.menuOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuContainer, { top: menuPosition.y, left: Math.max(menuPosition.x, 10) }]}>
              {user && (
                <View style={styles.userInfoSection}>
                  <View style={styles.userImageContainer}>
                    <Image source={user?.photoURL ? { uri: user.photoURL } : require("@/assets/images/default_profile_pic.png")} style={styles.userImage} resizeMode="cover" />
                  </View>
                  <View style={styles.userTextContainer}>
                    <Text style={styles.userName} numberOfLines={1}>{user.name || t('user')}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{user.email || ''}</Text>
                  </View>
                </View>
              )}
              <View style={styles.menuItemsContainer}>
                <TouchableOpacity style={[styles.menuItem, styles.logoutMenuItem]} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
                  <Text style={[styles.menuItemText, styles.logoutText]}>{t('logout')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const LanguageMenu = () => (
    <Modal transparent={true} visible={showLanguageMenu} animationType="fade" onRequestClose={closeAllMenus}>
      <TouchableWithoutFeedback onPress={closeAllMenus}>
        <View style={styles.menuOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuContainer, { top: menuPosition.y, left: Math.max(menuPosition.x, 10) }]}>
              <View style={styles.menuItemsContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => changeLanguage('en')}>
                  <Text style={styles.menuItemText}>{t('english')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => changeLanguage('es')}>
                  <Text style={styles.menuItemText}>{t('spanish')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleLogoPress}>
            <Image
              source={
                theme === 'dark'
                ? require("@/assets/images/logo_dark.png")
                : require("@/assets/images/logo.png")
              }
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <View style={[styles.center_header_container, { width: availableWidth }]}>
          <TouchableOpacity
            onPress={() => setIsFilterVisible(true)}
            style={styles.filterButton}
          >
            <FontAwesome5
              name="filter"
              style={[
                styles.filterIcon,
                Object.keys(filters).length > 0 && { color: colors.selected }
              ]}
            />
          </TouchableOpacity>
          <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={colors.tabIconDefault}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleHeaderSearch}
              returnKeyType="search"
              autoCorrect={false}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              selectionColor={colors.selected}
              cursorColor={colors.selected}
              underlineColorAndroid="transparent"
              blurOnSubmit={true}
              textAlignVertical="center"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="cancel" size={16} color={colors.background} />
              </TouchableOpacity>
            )}
            {isSearching && <ActivityIndicator size="small" color={colors.selected} style={styles.searchLoader} />}
          </View>
          <TouchableOpacity onPress={handleHeaderSearch} style={styles.searchButton} disabled={!searchQuery.trim()}>
            <FontAwesome name="search" style={[styles.searchIcon, !searchQuery.trim() && { opacity: 0.5 }]} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRightContainer}>
          <TouchableOpacity onPress={toggleTheme}>
            <FontAwesome name="adjust" style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity ref={languageButtonRef} onPress={handleLanguagePress}>
            <MaterialIcons name="translate" style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity ref={profileButtonRef} onPress={handleProfilePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View style={styles.profile_picture_container}>
              <Image source={user?.photoURL ? { uri: user.photoURL } : require("@/assets/images/default_profile_pic.png")} style={styles.profile_picture} resizeMode='cover' />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color={colors.selected} />
        </TouchableOpacity>
        <Text style={styles.scientificNameHeader} numberOfLines={1}>{scientificName}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]} onPress={() => setActiveTab('overview')}>
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>{t('overview')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'seasonality' && styles.tabItemActive]} onPress={() => setActiveTab('seasonality')}>
          <Text style={[styles.tabText, activeTab === 'seasonality' && styles.tabTextActive]}>{t('seasonality')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'seasonality' && renderSeasonality()}
      </View>

      {/* --- Modals --- */}
      <ProfileMenu />
      <LanguageMenu />
      <Modal visible={showCountryModal} animationType="slide" transparent={true} onRequestClose={() => setShowCountryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectCountry')}</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <TextInput style={styles.searchInputModal} placeholder={t('searchCountry')} value={countrySearch} onChangeText={setCountrySearch} />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.iso2}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedCountry(item); setSelectedRegion(null); setShowCountryModal(false); }}>
                  <Text style={styles.modalItemText}>{item.title}</Text>
                  {selectedCountry?.iso2 === item.iso2 && <FontAwesome name="check" size={16} color={colors.selected} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyListText}>{t('noVerifiedCountries')}</Text>}
            />
          </View>
        </View>
      </Modal>
      <Modal visible={showRegionModal} animationType="slide" transparent={true} onRequestClose={() => setShowRegionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectRegion')}</Text>
              <TouchableOpacity onPress={() => setShowRegionModal(false)}><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <TextInput style={styles.searchInputModal} placeholder={t('searchRegion')} value={regionSearch} onChangeText={setRegionSearch} />
            <FlatList
              data={filteredRegions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedRegion(item); setShowRegionModal(false); }}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedRegion === item && <FontAwesome name="check" size={16} color={colors.selected} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyListText}>{t('noRegionsForCountry')}</Text>}
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
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 20,
    backgroundColor: colors.tint,
  },
  headerLeft: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  logo: {
    width: 50,
    height: 40,
  },
  center_header_container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: '100%',
    alignSelf: 'center',
    marginHorizontal: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    minWidth: 100,
    position: 'relative',
  },
  searchContainerFocused: {
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.selected,
    backgroundColor: 'transparent',
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 4,
  },
  searchLoader: {
    position: 'absolute',
    right: 40,
    zIndex: 10,
  },
  searchButton: {
    padding: 8,
    marginLeft: 4,
  },
  searchIcon: {
    fontSize: 20,
    color: colors.background,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 15,
  },
  headerIcon: {
    fontSize: 25,
    color: colors.background,
    margin: 5
  },
  profile_picture_container: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.background,
  },
  profile_picture: {
    width: '100%',
    height: '100%',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 10,
  },
  scientificNameHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.selected,
    fontStyle: 'italic',
    flexShrink: 1,
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
  searchInputModal: {
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 10,
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: colors.background,
    borderRadius: 12,
    minWidth: 220,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  userImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.divider,
    marginRight: 12,
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.tabIconDefault,
  },
  menuItemsContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  logoutMenuItem: {
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
  },
  logoutText: {
    color: '#e74c3c',
  },
  filterButton: {
    padding: 8,
    marginRight: 4,
  },
  filterIcon: {
    fontSize: 20,
    color: colors.background,
  },
});