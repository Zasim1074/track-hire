import { apiRequest } from "./apiClient";

export const getCandidateProfile = () =>
  apiRequest("/candidates/me", { auth: true });
export const createCandidateProfile = (payload) =>
  apiRequest("/candidates/me", { method: "POST", body: payload, auth: true });
export const updateCandidateProfile = (payload) =>
  apiRequest("/candidates/me", { method: "PATCH", body: payload, auth: true });
