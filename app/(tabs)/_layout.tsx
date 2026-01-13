import FilterOverlay from '@/components/FilterOverlay';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FilterContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions
} from 'react-native';

export default function TabLayout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  const { filters, isFilterVisible, setIsFilterVisible } = useFilters();
  const router = useRouter();
  const { user, logout } = useAuth();
  const searchInputRef = useRef<TextInput>(null);
  const menuButtonRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);
  const languageButtonRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);

  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  
  // Responsive width calculation
  const isLargeScreen = screenWidth > 768;
  const availableWidth = isLargeScreen 
    ? Math.min(screenWidth * 0.6, 500)
    : screenWidth * 0.5; // Keep 50% on mobile for cleaner layout

  const { colors, theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const styles = createStyles(colors, screenWidth, isMobile);

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

  const handleMainMenuPress = () => {
    (menuButtonRef.current as any)?.measure?.(
      (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setMenuPosition({
          x: Math.min(pageX - 50, screenWidth - 250),
          y: pageY + height + 5,
        });
        setShowMainMenu(true);
      }
    );
  };
  
  const handleLanguagePress = () => {
    // On mobile, language is inside the main menu
    if (isMobile) {
      handleMainMenuPress();
    } else {
      (languageButtonRef.current as any)?.measure?.(
        (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          setMenuPosition({
            x: Math.min(pageX - 50, screenWidth - 150),
            y: pageY + height + 5,
          });
          setShowLanguageMenu(true);
        }
      );
    }
  };

  const handleLogout = async () => {
    setShowMainMenu(false);
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
    setShowMainMenu(false);
    setShowLanguageMenu(false);
  };
  
  const changeLanguage = (newLocale: string) => {
    setLocale(newLocale);
    setShowLanguageMenu(false);
    setShowMainMenu(false);
  };

  const MainMenu = () => (
    <Modal
      transparent={true}
      visible={showMainMenu}
      animationType="fade"
      onRequestClose={closeAllMenus}
    >
      <TouchableWithoutFeedback onPress={closeAllMenus}>
        <View style={styles.menuOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuContainer, { 
              top: menuPosition.y,
              left: Math.max(Math.min(menuPosition.x, screenWidth - 250), 10),
            }]}>
              {/* User info section - only show if logged in */}
              {user && (
                <View style={styles.userInfoSection}>
                  <View style={styles.userImageContainer}>
                    <Image
                      source={
                        user?.photoURL
                          ? { uri: user.photoURL }
                          : require("@/assets/images/default_profile_pic.png")
                      }
                      style={styles.userImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.userTextContainer}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user.name || t('user')}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email || ''}
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.menuItemsContainer}>
                {/* Theme toggle */}
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    toggleTheme();
                    closeAllMenus();
                  }}
                >
                  <FontAwesome name="adjust" size={20} color={colors.text} />
                  <Text style={styles.menuItemText}>
                    {theme === 'dark' ? t('lightMode') : t('darkMode')}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.menuDivider} />
                
                {/* Language option */}
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    closeAllMenus();
                    // On mobile, show language options inline
                    if (isMobile) {
                      // For mobile, we'll handle language change directly
                      // You could show another menu or implement inline selection
                      const newLocale = locale === 'en' ? 'es' : 'en';
                      changeLanguage(newLocale);
                    } else {
                      // On desktop, trigger the separate language menu
                      handleLanguagePress();
                    }
                  }}
                >
                  <MaterialIcons name="translate" size={20} color={colors.text} />
                  <Text style={styles.menuItemText}>
                    {locale === 'en' ? 'Español' : 'English'}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.menuDivider} />
                
                {/* Logout option - only show if logged in */}
                {user && (
                  <TouchableOpacity 
                    style={[styles.menuItem, styles.logoutMenuItem]}
                    onPress={handleLogout}
                  >
                    <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
                    <Text style={[styles.menuItemText, styles.logoutText]}>{t('logout')}</Text>
                  </TouchableOpacity>
                )}
                
                {/* Login option - only show if not logged in */}
                {!user && (
                  <TouchableOpacity 
                    style={[styles.menuItem]}
                    onPress={() => {
                      closeAllMenus();
                      router.push('/(auth)/login');
                    }}
                  >
                    <Ionicons name="log-in-outline" size={22} color={colors.text} />
                    <Text style={styles.menuItemText}>{t('login')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const LanguageMenu = () => (
    <Modal
      transparent={true}
      visible={showLanguageMenu}
      animationType="fade"
      onRequestClose={closeAllMenus}
    >
      <TouchableWithoutFeedback onPress={closeAllMenus}>
        <View style={styles.menuOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuContainer, {
              top: menuPosition.y,
              left: Math.max(Math.min(menuPosition.x, screenWidth - 150), 10),
            }]}>
              <View style={styles.menuItemsContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => changeLanguage('en')}
                >
                  <Text style={styles.menuItemText}>English</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => changeLanguage('es')}
                >
                  <Text style={styles.menuItemText}>Español</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarPosition: 'bottom',
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.divider,
          },
          headerShown: useClientOnlyValue(false, true),
          headerStyle: {
            backgroundColor: colors.tint,
            height: Platform.OS === 'ios' ? 100 : 80,
          },
          headerShadowVisible: false,
          headerTitle: ({ children }) => (
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

              <View style={[
                styles.searchContainer,
                isSearchFocused && styles.searchContainerFocused
              ]}>
                {/* Magnifying glass icon inside search bar */}
                <FontAwesome 
                  name="search" 
                  style={styles.searchBarIcon} 
                />
                
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
                  <TouchableOpacity 
                    onPress={handleClearSearch} 
                    style={styles.clearButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="cancel" size={16} color={colors.background} />
                  </TouchableOpacity>
                )}
                
                {isSearching && (
                  <ActivityIndicator 
                    size="small" 
                    color={colors.selected}
                    style={styles.searchLoader}
                  />
                )}
              </View>

              {/* External search button - only show on desktop/tablet */}
              {!isMobile && (
                <TouchableOpacity 
                  onPress={handleHeaderSearch} 
                  style={styles.searchButton}
                  disabled={!searchQuery.trim()}
                >
                  <FontAwesome name="search" style={[
                    styles.searchButtonIcon,
                    !searchQuery.trim() && { opacity: 0.5 }
                  ]} />
                </TouchableOpacity>
              )}
            </View>
          ),
          headerTitleAlign: 'center',
          headerTitleStyle: {
            flex: 1,
            maxWidth: '100%',
          },
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handleLogoPress}>
                <Image
                  source={
                    theme === 'dark'
                    ? require("@/assets/images/logo_dark.png")
                    : require("@/assets/images/logo.png")
                  }
                  style={[
                    styles.logo,
                    { width: isMobile ? 40 : 45 }
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {/* Mobile: Show hamburger menu with all options */}
              {isMobile ? (
                <TouchableOpacity 
                  ref={menuButtonRef}
                  onPress={handleMainMenuPress}
                  style={styles.menuButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="ellipsis-vertical" style={styles.menuIcon} />
                </TouchableOpacity>
              ) : (
                /* Desktop/Tablet: Show individual icons */
                <>
                  <TouchableOpacity 
                    onPress={toggleTheme} 
                    style={styles.headerIconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <FontAwesome name="adjust" style={styles.headerIcon} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    ref={languageButtonRef}
                    onPress={handleLanguagePress}
                    style={styles.headerIconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="translate" style={styles.headerIcon} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={handleMainMenuPress}
                    style={styles.profileButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={[
                      styles.profile_picture_container,
                      { width: 30, height: 30 }
                    ]}>
                      <Image
                        source={
                          user?.photoURL
                            ? { uri: user.photoURL }
                            : require("@/assets/images/default_profile_pic.png")
                        }
                        style={styles.profile_picture}
                        resizeMode='cover'
                      />
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
          headerRightContainerStyle: {
            minWidth: isMobile ? 50 : 90,
            paddingRight: 12,
            justifyContent: 'flex-end',
          },
          headerLeftContainerStyle: {
            minWidth: isMobile ? 60 : 65,
            paddingLeft: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('home'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="especies"
          options={{
            title: t('species'),
            href: null,
            headerShown: true,
          }}
        />
        
        <Tabs.Screen
          name="favorites"
          options={{
            title: t('favorites'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'star' : 'star-outline'} color={color} size={24} />
            ),
          }}
        />
      </Tabs>
      
      <MainMenu />
      <LanguageMenu />
      <FilterOverlay onApply={handleHeaderSearch} />
    </>
  );
}

const createStyles = (colors: any, screenWidth: number, isMobile: boolean) => StyleSheet.create({
  center_header_container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: 'center',
    flex: 1,
    maxWidth: '100%',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 25,
    paddingHorizontal: isMobile ? 12 : 15,
    height: isMobile ? 36 : 38,
    marginHorizontal: isMobile ? 6 : 8,
    position: 'relative',
    minWidth: isMobile ? 60 : 70,
  },
  searchContainerFocused: {
    backgroundColor: colors.background,
  },
  searchBarIcon: {
    fontSize: isMobile ? 16 : 18,
    color: colors.background,
    marginRight: 8,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: isMobile ? 14 : 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 8,
    color: colors.selected,
    borderWidth: 0,
    borderColor: 'transparent',
    outlineWidth: 0,
    outlineColor: 'transparent',
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterButton: {
    padding: isMobile ? 6 : 8,
    marginRight: isMobile ? 4 : 6,
  },
  filterIcon: {
    fontSize: isMobile ? 18 : 20,
    color: colors.background,
  },
  searchButton: {
    padding: 8,
    marginLeft: 6,
  },
  searchButtonIcon: {
    fontSize: 20,
    color: colors.background,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  searchLoader: {
    position: 'absolute',
    right: isMobile ? 35 : 40,
    zIndex: 10,
  },
  headerLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: isMobile ? 32 : 34,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: isMobile ? 0 : 12,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: colors.background,
  },
  headerIconButton: {
    padding: 4,
  },
  headerIcon: {
    fontSize: 22,
    color: colors.background,
  },
  profileButton: {
    padding: 2,
  },
  profile_picture_container: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.background,
  },
  profile_picture: {
    width: '100%',
    height: '100%',
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
    width: Math.min(screenWidth - 40, 250),
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
    padding: screenWidth < 375 ? 12 : 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  userImageContainer: {
    width: screenWidth < 375 ? 32 : 40,
    height: screenWidth < 375 ? 32 : 40,
    borderRadius: screenWidth < 375 ? 16 : 20,
    overflow: 'hidden',
    backgroundColor: colors.divider,
    marginRight: screenWidth < 375 ? 8 : 12,
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: screenWidth < 375 ? 14 : 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: screenWidth < 375 ? 11 : 13,
    color: colors.tabIconDefault,
  },
  menuItemsContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: screenWidth < 375 ? 10 : 12,
    paddingHorizontal: screenWidth < 375 ? 12 : 16,
    gap: screenWidth < 375 ? 8 : 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  menuItemText: {
    fontSize: screenWidth < 375 ? 14 : 15,
    color: colors.text,
    fontWeight: '500',
  },
  logoutMenuItem: {
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
  },
  logoutText: {
    color: '#e74c3c',
  },
});