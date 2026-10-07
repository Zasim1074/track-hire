import { apiRequest } from "./apiClient";

export const getApplicationInterviews = ({ application_id }) =>
  apiRequest(`/interviews/applications/${application_id}`, { auth: true });

export const scheduleInterview = (id, payload) =>
  apiRequest(`/interviews/applications/${id}`, {
    method: "POST",
    body: payload,
    auth: true,
  });

export const updateInterview = (id, payload) =>
  apiRequest(`/interviews/${id}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });

export const interviewAction = (id, action) =>
  apiRequest(`/interviews/${id}/${action}`, { method: "POST", auth: true });

export const getInterviewFeedback = (id) =>
  apiRequest(`/interviews/${id}/feedback`, { auth: true });

export const submitInterviewFeedback = (id, payload) =>
  apiRequest(`/interviews/${id}/feedback`, {
    method: "POST",
    body: payload,
    auth: true,
  });
