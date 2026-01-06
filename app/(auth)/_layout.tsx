import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";
import { Image, Pressable, StyleSheet, Text } from "react-native";

export default function AuthLayout() {
  const { login } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.tint
        },
        headerShadowVisible: false,
        headerTitle: "",
        headerRight: () => (
          <Pressable 
            style={({hovered, pressed}) => [

              styles.headerButton,
              hovered && styles.headerButtonHovered
              
            ]} 
            onPress={login}>
            <Image
              source={require("@/assets/images/auth0_logo.png")}
              style={styles.icon}
              resizeMode="contain"
            />
            <Text style={styles.bold}>Login with Auth0</Text>
          </Pressable>
        ),
        headerLeft: () => (
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
          />
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  headerButton: {
    height: "100%",
    flexDirection: "row",
    backgroundColor: Colors.light.selected,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonHovered:{
    height: "100%",
    flexDirection: "row",
    backgroundColor: Colors.light.hover,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  bold:{
    fontWeight: 600,
    color: Colors.light.background
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10
  },
  logo:{
    height: "35%",
    resizeMode: "contain",
    marginLeft: -80
  }
});
