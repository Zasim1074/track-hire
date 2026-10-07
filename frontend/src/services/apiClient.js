const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const TOKEN_KEY = "trackhire_access_token";

export class ApiError extends Error {
  constructor(status, message, detail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const setAccessToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearAccessToken = () => localStorage.removeItem(TOKEN_KEY);

const pendingGetRequests = new Map();

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    auth = false,
    headers = {},
    responseType = "json",
  } = options;

  if (method !== "GET") return performApiRequest(path, options);

  const requestKey = JSON.stringify([
    path,
    method,
    auth,
    auth ? getAccessToken() : null,
    responseType,
    [...new Headers(headers).entries()],
  ]);
  const pendingRequest = pendingGetRequests.get(requestKey);
  if (pendingRequest) return pendingRequest;

  const request = performApiRequest(path, options);
  pendingGetRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    if (pendingGetRequests.get(requestKey) === request) {
      pendingGetRequests.delete(requestKey);
    }
  }
}

async function performApiRequest(
  path,
  {
    method = "GET",
    body,
    headers = {},
    auth = false,
    responseType = "json",
  } = {},
) {
  const requestHeaders = new Headers(headers);
  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData)
    requestHeaders.set("Content-Type", "application/json");
  if (auth) {
    const token = getAccessToken();
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach TrackHire. Check that the API is running.",
    );
  }

  if (response.status === 204) return null;
  if (response.ok && responseType === "blob") return response.blob();
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    if (response.status === 401) {
      clearAccessToken();
      window.dispatchEvent(new Event("trackhire:unauthorized"));
    }
    const detail = data?.detail;
    const validationDetails = (data?.errors || [])
      .map((issue) => `${Array.isArray(issue.loc) ? issue.loc.filter((part) => part !== "body").join(".") : ""}: ${issue.msg}`.replace(/^: /, ""))
      .filter(Boolean);
    const message =
      typeof detail === "string"
        ? response.status === 422 && validationDetails.length
          ? validationDetails.join(" · ")
          : detail
        : response.status === 401
          ? "Please sign in again."
          : response.status === 403
            ? "You do not have permission to perform this action."
            : response.status === 404
              ? "The requested item could not be found."
              : response.status === 409
                ? "This action conflicts with an existing record."
                : response.status === 422
                  ? "Please check the submitted information."
                  : "Something went wrong on the server.";
    throw new ApiError(response.status, message, detail);
  }
  return data;
}
