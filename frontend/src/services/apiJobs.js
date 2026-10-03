import { apiRequest } from "./apiClient";

export async function getJobs({ location, company, searchQuery } = {}) {
  const params = new URLSearchParams({ page: "1", page_size: "100", status: "published" });
  if (searchQuery) params.set("search", searchQuery);
  // Location and company filters are not part of GET /api/jobs; apply them client-side.
  let result = await apiRequest(`/api/jobs?${params}`);
  const jobs = [...(result.items || [])];
  for (let page = 2; page <= result.total_pages; page += 1) {
    params.set("page", String(page));
    result = await apiRequest(`/api/jobs?${params}`);
    jobs.push(...(result.items || []));
  }
  return jobs.filter((job) =>
    (!company || String(job.company_id) === String(company)) &&
    (!location || job.location?.toLowerCase() === location.toLowerCase())
  );
}

export const getSingleJob = ({ job_id }) => apiRequest(`/api/jobs/${job_id}`);
export const getHiringStatus = ({ job_id, isOpen }) => apiRequest(`/api/jobs/${job_id}/${isOpen ? "publish" : "close"}`, { method: "POST", auth: true });
export const postNewJob = (payload) => apiRequest("/api/jobs", { method: "POST", body: payload, auth: true });
export const deleteJob = ({ job_id }) => apiRequest(`/api/jobs/${job_id}`, { method: "DELETE", auth: true });
export const updateJob = ({ job_id, ...payload }) => apiRequest(`/api/jobs/${job_id}`, { method: "PATCH", body: payload, auth: true });
export const fetchSavedJobs = () => apiRequest("/api/saved-jobs/", { auth: true });
export const getSavedJobs = ({ job_id, alreadySaved }) => apiRequest(`/api/saved-jobs/${job_id}`, { method: alreadySaved ? "DELETE" : "POST", auth: true });
