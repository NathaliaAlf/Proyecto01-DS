import FilterOverlay from '@/components/FilterOverlay';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FilterContext';
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
    // --- STATE & HOOKS (Merged from V1 to keep Filter logic) ---
    const { filters, setIsFilterVisible } = useFilters();
      const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  const router = useRouter();
    const { user, logout } = useAuth();
    const searchInputRef = useRef<TextInput>(null);

    const profileButtonRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);
  const { width: screenWidth } = useWindowDimensions();
    const SIDE_ELEMENTS_WIDTH = 400;
    const availableWidth = Math.max(screenWidth - SIDE_ELEMENTS_WIDTH, 100);

    // --- HANDLERS (Merged from V1) ---
    const handleLogoPress = () => {
        // Note: If your file is named index.tsx, change '/home' to '/' or '/(tabs)'
        router.push({ pathname: '/home' });
    };

  const { colors, theme, toggleTheme } = useTheme();
  const styles = createStyles(colors);

    const handleHeaderSearch = async () => {
        const cleanQuery = searchQuery.trim();
        if (!cleanQuery) return;

        setIsSearching(true);
        searchInputRef.current?.blur();

        try {
            router.push({
                pathname: '/(tabs)/especies',
                params: {
                    search: cleanQuery,
                    ...filters
                }
            });
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setTimeout(() => setIsSearching(false), 500);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        searchInputRef.current?.focus();
    };

  const handleProfilePress = () => {
    // Use the measure method that exists on the ref
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

  const handleLogout = async () => {
    setShowProfileMenu(false);
    console.log("touched the logout button");
  
    try {
      // Perform logout
      await logout();
      
      // Give a small delay for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to login
      router.replace('/(auth)/login');
      
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
    }
  };

  const closeProfileMenu = () => {
    setShowProfileMenu(false);
  };

  const ProfileMenu = () => (
    <Modal
      transparent={true}
      visible={showProfileMenu}
      animationType="fade"
      onRequestClose={closeProfileMenu}
    >
      <TouchableWithoutFeedback onPress={closeProfileMenu}>
        <View style={styles.menuOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuContainer, { 
              top: menuPosition.y,
              left: Math.max(menuPosition.x, 10), // Ensure it doesn't go off screen
            }]}>
              {/* User info section */}
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
                      {user.name || 'User'}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email || ''}
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Menu items */}
              <View style={styles.menuItemsContainer}>
                <TouchableOpacity 
                  style={[styles.menuItem, styles.logoutMenuItem]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
                  <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
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
                    tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
                    headerShown: useClientOnlyValue(false, true),
                    headerStyle: {
                        backgroundColor: Colors.light.tint,
                    },
                    headerShadowVisible: false,
                    headerTitle: () => (
                        <View style={[styles.center_header_container, { width: availableWidth }]}>
                            {/* Filter Button - V1 (Functional) */}
                            <TouchableOpacity
                                onPress={() => setIsFilterVisible(true)}
                                style={styles.filterButton}
                            >
                                <FontAwesome5 name="filter" style={[
                                    styles.filterIcon,
                                    Object.keys(filters).length > 0 && { color: Colors.light.selected }
                                ]}  />
                            </TouchableOpacity>
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
                onPress={() => console.log('Filter pressed')} 
                style={styles.filterButton}
              >
                <FontAwesome5 name="filter" style={styles.filterIcon} />
              </TouchableOpacity>

                            {/* Search Bar - V1 Logic (includes styles for loader) */}
                              <View style={[
                                  styles.searchContainer,
                                  isSearchFocused && styles.searchContainerFocused
                              ]}>
                                  <TextInput
                                      ref={searchInputRef}
                                      style={styles.searchInput}
                                      placeholder="Ex: Sloth"
                                      placeholderTextColor={colors.tint}
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
                                          <MaterialIcons name="cancel" size={16} color={colors.tint} />
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
                              <TouchableOpacity onPress={() => handleLogoPress()}>
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

                              <TouchableOpacity>
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
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'star' : 'star-outline'} color={color} size={24} />
            ),
          }}
        />
      </Tabs>
      
      <ProfileMenu />
    </>
  );
}

// --- STYLES (Merged: primarily V1 as it had better loader positioning) ---
const styles = StyleSheet.create({
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
        backgroundColor: Colors.light.background,
        borderRadius: 25,
        paddingHorizontal: 15,
        height: 40,
        marginHorizontal: 8,
        minWidth: 100,
        position: 'relative', // From V1: Needed for absolute loader
    },
    searchContainerFocused: {
        backgroundColor: Colors.light.background,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        paddingHorizontal: 8,
        color: Colors.light.selected,
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
        color: 'white',
    },
    searchButton: {
        padding: 8,
        marginLeft: 4,
    },
    searchIcon: {
        fontSize: 20,
        color: 'white',
    },
    clearButton: {
        padding: 4,
        marginLeft: 4,
    },
    searchLoader: {
        // V1 Styles (Absolute positioning works better inside search bar)
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
        color: 'white',
        margin: 5
    },
    profile_picture_container: {
        width: 25,
        height: 25,
        borderRadius: 13,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    profile_picture: {
        width: '100%',
        height: '100%',
    },
});