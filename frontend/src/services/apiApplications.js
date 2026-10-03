import { apiRequest } from "./apiClient";

export async function applyToJob({ job_id, resume_id, cover_letter }) {
  return apiRequest(`/api/jobs/${job_id}/applications`, {
    method: "POST", body: { resume_id, cover_letter: cover_letter || null }, auth: true,
  });
}

export const updateApplicationStatus = ({ application_id, status, recruiter_notes = null }) =>
  apiRequest(`/api/applications/${application_id}/status`, {
    method: "PATCH", body: { status, recruiter_notes }, auth: true,
  });

export async function getAppliedJobs() {
  const result = await apiRequest("/api/applications/me?page=1&page_size=100", { auth: true });
  return result.items || [];
}

export async function getPostedJobs() {
  const result = await apiRequest("/api/jobs/me?page=1&page_size=100", { auth: true });
  return result.items || [];
}

export async function getJobApplications({ job_id }) {
  const result = await apiRequest(`/api/jobs/${job_id}/applications/review?page=1&page_size=100`, { auth: true });
  return result.items || [];
}

export const selectApplication = (id) => apiRequest(`/api/${id}/select`, { method: "POST", auth: true });
export const rejectApplication = (id, reason = null) => apiRequest(`/api/${id}/reject`, { method: "POST", body: { reason }, auth: true });
export const withdrawApplication = (id) => apiRequest(`/api/applications/${id}/withdraw`, { method: "POST", auth: true });
export const getApplicationHistory = (id) => apiRequest(`/api/${id}/history`, { auth: true });
export const downloadApplicantResume = (id) => apiRequest(`/api/applications/${id}/resume`, { auth: true, responseType: "blob" });
