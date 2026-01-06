import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider, useAuth } from "@/context/AuthContext";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  
  if (!loaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {!user ? (
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
          </Stack>

        </>
      ) : (
        <>
          <Redirect href="/(tabs)" />

          <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal" }}
            />
          </Stack>
        </>
      )}
    </ThemeProvider>
  );
}


