import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "./supabase";

export function setupApi() {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) {
    setBaseUrl(`https://${domain}`);
  }

  setAuthTokenGetter(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  });
}
