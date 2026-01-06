import { saveUserIfNotExists } from "@/services/userService";
import { deleteItem, getItem, saveItem } from "@/utils/storage";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN!;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!;

type UserProfile = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

type AuthContextType = {
  user: UserProfile | null;
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
  const [user, setUser] = useState<UserProfile | null>(null);
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

        const profile = jwtDecode<UserProfile>(tokenResult.idToken!);
        setUser(profile);
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

          const profile = jwtDecode<UserProfile>(tokens.idToken);

          setUser(profile);
          await saveUserIfNotExists(profile);
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
    if (!request) return; // ✅ prevent early call
    await promptAsync();
  };

  const logout = async () => {
    setUser(null);
    await deleteItem("authTokens");
  };

  /* ---------- DEBUG ---------- */
  useEffect(() => {
    if (user) {
      console.log("Logged in user:", user.name);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
