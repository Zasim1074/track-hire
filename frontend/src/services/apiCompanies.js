import { apiRequest } from "./apiClient";

export async function getCompanies() {
  const result = await apiRequest("/companies/?page=1&page_size=100");
  return result.items || [];
}

export const getCompany = ({ company_id }) => apiRequest(`/companies/${company_id}`);
export const getMyCompany = () => apiRequest("/companies/me", { auth: true });

export async function addNewCompany(company) {
  const result = await apiRequest("/companies/", { method: "POST", body: company, auth: true });
  return result.details || result;
}
