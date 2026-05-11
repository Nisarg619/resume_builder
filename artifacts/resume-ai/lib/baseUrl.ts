export function getApiBaseUrl(): string {
  const explicitBaseUrl = process.env["EXPO_PUBLIC_API_BASE_URL"];
  if (explicitBaseUrl) return explicitBaseUrl;

  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (!domain) return "";

  const isLocalhost = domain.includes("localhost") || domain.startsWith("127.0.0.1");
  return `${isLocalhost ? "http" : "https"}://${domain}`;
}

