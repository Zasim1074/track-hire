export const API_BASE_URL = (
  import.meta.env.MODE === "production"
    ? "https://track-hire-production.up.railway.app"
    : "http://localhost:8000"
).replace(/\/+$/, "");