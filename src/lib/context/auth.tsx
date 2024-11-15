"use client";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface IAuth {
  isAuthenticated: boolean;
  token: string | null;
  user: Record<string, string> | null;
  logout: () => void;
}

const init: IAuth = {
  isAuthenticated: false,
  token: null,
  user: null,
  logout: () => {},
};

const AuthContext = createContext(init);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Record<string, string> | null>(null);
  const [isAuthenticated, setAuth] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // const getUserInfo = async (accessToken: string) => {
  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       }
  //     );
  //     if (res.ok) {
  //       const data = await res.json();
  //       setUser(data);
  //       setAuth(true);
  //     } else {
  //       console.error("Failed to fetch user info");
  //       // login(); // Redirect to login if token is invalid
  //     }
  //   } catch (error) {
  //     console.error("Error fetching user info:", error);
  //   }
  // };

  const login = () => {
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_ID;
    const redirectUri = `${window.location.origin}/callback`; // Your app's callback URL
    window.location.href = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${
      process.env.NEXT_PUBLIC_KEYCLOAK_REALM
    }/protocol/openid-connect/auth?client_id=${clientId}&scope=openid%20email&response_mode=fragment&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
  };

  const handleCallback = async (code: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: process.env.NEXT_PUBLIC_KEYCLOAK_ID!,
            client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET!,
            code,
            redirect_uri: `${window.location.origin}/callback`,
          }),
        }
      );
      console.log(res);

      if (res.ok) {
        const data = await res.json();
        const accessToken = data.access_token;
        const idToken = data.id_token;
        const refreshToken = data.refresh_token;
        document.cookie = `access_token=${accessToken}; domain=.fforward.finance; path=/; max-age=604800; SameSite=None; Secure`;
        document.cookie = `refresh_token=${refreshToken}; domain=.fforward.finance; path=/; max-age=604800; SameSite=None; Secure`;
        document.cookie = `id_token=${idToken}; domain=.fforward.finance; path=/; max-age=604800; SameSite=None; Secure`;
        setToken(accessToken);
        // getUserInfo(accessToken);
      } else {
        console.error("Failed to exchange code for token");
      }
    } catch (error) {
      console.error("Error during token exchange:", error);
    }
  };

  const logout = useCallback(() => {
    console.log("logout");
    const idToken = getCookie("id_token");
    document.cookie =
      "access_token=; domain=.fforward.finance; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";
    document.cookie =
      "refresh_token=; domain=.fforward.finance; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";
    document.cookie =
      "id_token=; domain=.fforward.finance; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";
    setUser(null);
    setAuth(false);
    const endSessionEndPoint = new URL(
      `${process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
    );
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${
      process.env.NEXT_PUBLIC_KEYCLOAK_REALM
    }/protocol/openid-connect/auth?client_id=${clientId}&scope=openid%20email&response_mode=fragment&response_type=code&redirect_uri=${encodeURIComponent(
      `${window.location.origin}/callback`
    )}`;
    const params = {
      id_token_hint: idToken as string,
      post_logout_redirect_uri: redirectUri,
    };
    const endSessionParams = new URLSearchParams(
      params as Record<string, string>
    );

    const url = `${endSessionEndPoint.href}?${endSessionParams.toString()}`;

    window.location.href = url;
  }, []);

  useEffect(() => {
    console.log("checking cookie");

    const checkCookie = () => {
      const token = getCookie("access_token") as string | undefined;

      if (token) {
        setToken(token);
        setAuth(true);
        // getUserInfo(token);
      } else if (window.location.pathname.includes("/callback")) {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          handleCallback(code);
        }
      } else {
        login();
      }
    };

    // Initial check with a small delay
    setTimeout(checkCookie, 300);

    const intervalId = setInterval(checkCookie, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [router]);
  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
