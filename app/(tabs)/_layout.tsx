import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

import { useAuth } from '@/context/AuthContext';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome6>["name"];
  color: string;
}) {
  return <FontAwesome6 size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {backgroundColor: Colors.light.tint},
        headerShadowVisible: false,
        headerTitle: "",
        headerLeft: () => (
          <Pressable>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Pressable>
        ),
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <FontAwesome name="adjust" style={styles.icon} />
            <MaterialIcons name="translate" style={styles.icon} />
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
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tab One",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="code" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="two"
        options={{
          title: 'Tab Two',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
      <Tabs.Screen
        name="especies"
        options={{
          title: 'Especies',
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="DetailedDescription"
        options={{
          title: 'Detalle',
          tabBarIcon: ({ color }) => <TabBarIcon name="info" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}


const styles = StyleSheet.create({
  icon: {
    margin: 10,
    fontSize: 25,
    color: "white",
  },
  headerRightContainer: {
    flexDirection: "row"
  },
  logo: {
    margin: 30,
    height: 22
  },
  profile_picture_container:{
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    marginLeft: 10
  },
  profile_picture: {
    width: 36,
    height: 36,
    borderRadius: 18,
  }
});