import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "./supabase";

export function setupApi() {
  const explicitBaseUrl = process.env["EXPO_PUBLIC_API_BASE_URL"];
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];

  if (explicitBaseUrl) {
    setBaseUrl(explicitBaseUrl);
  } else if (domain) {
    const isLocalhost = domain.includes("localhost") || domain.startsWith("127.0.0.1");
    setBaseUrl(`${isLocalhost ? "http" : "https"}://${domain}`);
  }

  setAuthTokenGetter(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  });
}
