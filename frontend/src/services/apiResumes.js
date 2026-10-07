import { apiRequest } from "./apiClient";

export async function uploadResume(file) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest("/resumes", { method: "POST", body: form, auth: true });
}

export const getMyResumes = () => apiRequest("/resumes/me", { auth: true });
export const deleteResume = (resume_id) =>
  apiRequest(`/resumes/${resume_id}`, { method: "DELETE", auth: true });
export const setDefaultResume = (resume_id) =>
  apiRequest(`/resumes/${resume_id}/default`, { method: "PATCH", auth: true });
export const downloadResume = (resume_id) =>
  apiRequest(`/resumes/${resume_id}/download`, {
    auth: true,
    responseType: "blob",
  });
