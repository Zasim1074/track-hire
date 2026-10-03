import { apiRequest, clearAccessToken, setAccessToken } from "./apiClient";

export async function login(credentials) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: credentials,
  });
  setAccessToken(result.token.access_token);
  return result;
}

export const register = (profile) =>
  apiRequest("/auth/register", { method: "POST", body: profile });

export function logout() {
  clearAccessToken();
}
