import { saveUserIfNotExists } from "@/services/userService";
import { getItem, saveItem } from "@/utils/storage";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN!;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!;

export type Auth0Profile = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

export type AppUser = {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
};


type AuthContextType = {
  user: AppUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};


const AuthContext = createContext<AuthContextType | undefined>(undefined);

const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "devwebmob", 
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: "code",
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type !== "success") return;
    if (!request?.codeVerifier) return;

    const codeVerifier = request.codeVerifier;
    const authCode = response.params.code;

    const exchangeToken = async () => {
      try {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code: authCode,
            redirectUri,
            extraParams: {
              code_verifier: codeVerifier,
            },
          },
          discovery
        );

        const storedTokens = {
          accessToken: tokenResult.accessToken,
          idToken: tokenResult.idToken,
          expiresIn: tokenResult.expiresIn,
          issuedAt: tokenResult.issuedAt,
        };

        await saveItem("authTokens", JSON.stringify(storedTokens));

        const auth0Profile = jwtDecode<Auth0Profile>(tokenResult.idToken!);
        const firebaseUser = await saveUserIfNotExists(auth0Profile);
        setUser(firebaseUser);


      } catch (e) {
        console.error("Auth error:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    exchangeToken();
  }, [response]);


  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await getItem("authTokens");

        if (stored) {
          const tokens: {
            accessToken: string;
            idToken: string;
          } = JSON.parse(stored);

          const auth0Profile = jwtDecode<Auth0Profile>(tokens.idToken);
          const firebaseUser = await saveUserIfNotExists(auth0Profile);
          setUser(firebaseUser);


        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /* ---------- ACTIONS ---------- */
  const login = async () => {
    if (!request) return;
    await promptAsync();
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync("authTokens");
    setLoading(false);
  };


  useEffect(() => {
    if (user) {
      console.log("Logged in user:", user.name);
    }
  }, [user]);


  useEffect(() => {
    if (__DEV__) {
      // @ts-ignore
      global.logout = logout;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
