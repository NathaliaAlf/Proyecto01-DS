import Colors from '@/constants/Colors';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function TabNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  
  const isHome = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
  const isFavorites = pathname === '/(tabs)/favorites';

  return (
    <View style={styles.tabContainer}>
      <Pressable
        onPress={() => router.push('/(tabs)')}
        style={[styles.tab, isHome && styles.tabActive]}
      >
        {({ hovered }) => (
          <>
            <Entypo 
              name="home" 
              size={20} 
              color={isHome ? Colors.light.tint : Colors.light.tabIconDefault}
              style={hovered && styles.tabHovered}
            />
            <Text style={[
              styles.tabText, 
              isHome && styles.tabTextActive,
              hovered && styles.tabTextHovered
            ]}>
              Home
            </Text>
          </>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.push('/(tabs)/favorites')}
        style={[styles.tab, isFavorites && styles.tabActive]}
      >
        {({ hovered }) => (
          <>
            <Ionicons 
              name="heart" 
              size={20} 
              color={isFavorites ? Colors.light.tint : Colors.light.tabIconDefault}
              style={hovered && styles.tabHovered}
            />
            <Text style={[
              styles.tabText, 
              isFavorites && styles.tabTextActive,
              hovered && styles.tabTextHovered
            ]}>
              Favorites
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: Colors.light.tint + '15',
  },
  tabHovered: {
    opacity: 0.7,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.tabIconDefault,
  },
  tabTextActive: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  tabTextHovered: {
    opacity: 0.7,
  },
});