import { apiRequest } from "./apiClient";

export async function getJobs({ location, company, searchQuery } = {}) {
  const result = await getJobPage({ searchQuery, page_size: 100 });
  return (result.items || []).filter(
    (job) =>
      (!company || String(job.company_id) === String(company)) &&
      (!location || job.location?.toLowerCase() === location.toLowerCase()),
  );
}

export const getSingleJob = ({ job_id }) => apiRequest(`/api/jobs/${job_id}`, { auth: true });
export const getJobPage = ({
  page = 1,
  page_size = 20,
  searchQuery = "",
  work_mode,
  employment_type,
  experience_level,
} = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
  });
  if (searchQuery) params.set("search", searchQuery);
  if (work_mode) params.set("work_mode", work_mode);
  if (employment_type) params.set("employment_type", employment_type);
  if (experience_level) params.set("experience_level", experience_level);
  return apiRequest(`/api/jobs?${params}`);
};
export const getHiringStatus = ({ job_id, isOpen }) =>
  apiRequest(`/api/jobs/${job_id}/${isOpen ? "publish" : "close"}`, {
    method: "POST",
    auth: true,
  });
export const postNewJob = (payload) =>
  apiRequest("/api/jobs", { method: "POST", body: payload, auth: true });
export const deleteJob = ({ job_id }) =>
  apiRequest(`/api/jobs/${job_id}`, { method: "DELETE", auth: true });
export const updateJob = ({ job_id, ...payload }) =>
  apiRequest(`/api/jobs/${job_id}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
export const fetchSavedJobs = () =>
  apiRequest("/api/saved-jobs/", { auth: true });
export const getSavedJobs = ({ job_id, alreadySaved }) =>
  apiRequest(`/api/saved-jobs/${job_id}`, {
    method: alreadySaved ? "DELETE" : "POST",
    auth: true,
  });
