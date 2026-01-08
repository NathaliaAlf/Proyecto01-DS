import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const searchInputRef = useRef<TextInput>(null);
  const { width: screenWidth } = useWindowDimensions();

  const SIDE_ELEMENTS_WIDTH = 400; 
  const availableWidth = Math.max(screenWidth - SIDE_ELEMENTS_WIDTH, 100);

  const handleHeaderSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      router.push({
        pathname: '/(tabs)/especies',
        params: { search: searchQuery }
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
      searchInputRef.current?.blur();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
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
            <TouchableOpacity 
              onPress={() => console.log('Filter pressed')} 
              style={styles.filterButton}
            >
              <FontAwesome5 name="filter" style={styles.filterIcon} />
            </TouchableOpacity>

            <View style={[
              styles.searchContainer,
              isSearchFocused && styles.searchContainerFocused
            ]}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Ex: Sloth"
                placeholderTextColor={Colors.light.tint}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleHeaderSearch}
                returnKeyType="search"
                autoCorrect={false}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                selectionColor={Colors.light.selected}
                cursorColor={Colors.light.selected}
                underlineColorAndroid="transparent"
                blurOnSubmit={false}
                textAlignVertical="center"
              />
              
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={handleClearSearch} 
                  style={styles.clearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="cancel" size={16} color={Colors.light.tint} />
                </TouchableOpacity>
              )}
              
              {isSearching && (
                <ActivityIndicator 
                  size="small" 
                  color={Colors.light.selected}
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
            <TouchableOpacity>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        ),
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            
            <TouchableOpacity>
              <FontAwesome name="adjust" style={styles.headerIcon} />
            </TouchableOpacity>

            <TouchableOpacity>
              <MaterialIcons name="translate" style={styles.headerIcon} />
            </TouchableOpacity>

            <TouchableOpacity>
              <View style={styles.profile_picture_container}>
                <Image
                  source={
                    user?.photoURL
                    ? { uri: user.photoURL }
                    : require("@/assets/images/default_profile_pic.png")
                  }
                  style={styles.profile_picture}
                  resizeMode='center'
                  />
              </View>
            </TouchableOpacity>

          </View>
        ),
        headerRightContainerStyle: {
          width: 70, // Ancho fijo para el lado derecho
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="especies"
        options={{
          title: 'Especies',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'leaf' : 'leaf-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

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
    marginLeft: 8,
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