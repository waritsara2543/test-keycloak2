"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";

const Callback = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const params = new URLSearchParams(window.location.hash.substring(1)); // Remove the '#' from the hash
      const code = params.get("code");
      console.log("code", code);
      if (code) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: process.env.NEXT_PUBLIC_KEYCLOAK_ID || "",
                client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET || "", // Optional, depends on your Keycloak configuration
                code,
                redirect_uri: `${window.location.origin}/callback`,
              }),
            }
          );
          if (!response.ok) {
            throw new Error("Token exchange failed");
          }

          const data = await response.json();
          const accessToken = data.access_token;
          const refreshToken = data.refresh_token;
          const idToken = data.id_token;

          // Store tokens in cookies
          document.cookie = `access_token=${accessToken}; domain=.fforward.finance; path=/; max-age=604800; SameSite=None; Secure`;
          document.cookie = `refresh_token=${refreshToken}; domain=.fforward.finance; path=/; max-age=604800; SameSite=None; Secure`;
          document.cookie = `id_token=${idToken}; domain=.fforward.finance; path=/; max-age=604800; SameSite=None; Secure`;

          // Redirect to the main page or dashboard after successful login
          router.push("/keycloak");
        } catch (error) {
          console.error("Error during token exchange:", error);
          // Handle errors (e.g., redirect to an error page or show a message)
        }
      } else {
        console.error("Authorization code not found in the URL");
        // Optionally, redirect to the login page if the code is missing
        // router.push("/login");
      }
    };
    const token = getCookie("access_token") as string | undefined;
    if (!token) {
      handleAuthCallback();
    } else {
      router.push("/keycloak");
    }
  }, [router]);

  return <div>Processing login, please wait...</div>;
};

export default Callback;
