import FilterOverlay from '@/components/FilterOverlay';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FilterContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  const { filters, isFilterVisible, setIsFilterVisible } = useFilters();
  const router = useRouter();
  const { user, logout } = useAuth();
  const searchInputRef = useRef<TextInput>(null);
  const profileButtonRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);
  const languageButtonRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);

  const { width: screenWidth } = useWindowDimensions();
  const SIDE_ELEMENTS_WIDTH = 400;
  const availableWidth = Math.max(screenWidth - SIDE_ELEMENTS_WIDTH, 100);

  const { colors, theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const styles = createStyles(colors);

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
        setMenuPosition({
          x: pageX - 160,
          y: pageY + height + 5,
        });
        setShowProfileMenu(true);
      }
    );
  };
  
  const handleLanguagePress = () => {
    (languageButtonRef.current as any)?.measure(
        (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          setMenuPosition({
            x: pageX - 160,
            y: pageY + height + 5,
          });
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

  const ProfileMenu = () => (
    <Modal
      transparent={true}
      visible={showProfileMenu}
      animationType="fade"
      onRequestClose={closeAllMenus}
    >
      <TouchableWithoutFeedback onPress={closeAllMenus}>
        <View style={styles.menuOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuContainer, { 
              top: menuPosition.y,
              left: Math.max(menuPosition.x, 10),
            }]}>
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
                <TouchableOpacity 
                  style={[styles.menuItem, styles.logoutMenuItem]}
                  onPress={handleLogout}
                >
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
                left: Math.max(menuPosition.x, 10),
              }]}>
                <View style={styles.menuItemsContainer}>
                  <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => changeLanguage('en')}
                  >
                    <Text style={styles.menuItemText}>{t('english')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => changeLanguage('es')}
                  >
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
          },
          headerShadowVisible: false,
          headerTitle: () => (
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

              <TouchableOpacity 
                onPress={handleHeaderSearch} 
                style={styles.searchButton}
                disabled={!searchQuery.trim()}
              >
                <FontAwesome name="search" style={[
                  styles.searchIcon,
                  !searchQuery.trim() && { opacity: 0.5 }
                ]} />
              </TouchableOpacity>
            </View>
          ),
          headerTitleAlign: 'center',
          headerTitleStyle: {
            flex: 1,
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
                  style={styles.logo}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              
              <TouchableOpacity onPress={toggleTheme}>
                <FontAwesome name="adjust" style={styles.headerIcon} />
              </TouchableOpacity>

              <TouchableOpacity ref={languageButtonRef} onPress={handleLanguagePress}>
                <MaterialIcons name="translate" style={styles.headerIcon} />
              </TouchableOpacity>

              <TouchableOpacity 
                ref={profileButtonRef}
                onPress={handleProfilePress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.profile_picture_container}>
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

            </View>
          ),
          headerRightContainerStyle: {
            width: 70,
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
      
      <ProfileMenu />
      <LanguageMenu />
      <FilterOverlay onApply={handleHeaderSearch} />
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  center_header_container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: '100%',
    alignSelf: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    marginHorizontal: 8,
    minWidth: 100,
    position: 'relative',
  },
  searchContainerFocused: {
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
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
    padding: 8,
    marginRight: 4,
  },
  filterIcon: {
    fontSize: 20,
    color: colors.background,
  },
  searchButton: {
    padding: 8,
    marginLeft: 4,
  },
  searchIcon: {
    fontSize: 20,
    color: colors.background,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  searchLoader: {
    position: 'absolute',
    right: 40,
    zIndex: 10,
  },
  headerLeft: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 30
  },
  logo: {
    width: 50,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 30
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
});