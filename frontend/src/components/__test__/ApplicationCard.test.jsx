import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const authState = vi.hoisted(() => ({ user: null }));
const applicationApi = vi.hoisted(() => ({
  updateApplicationStatus: vi.fn(),
  selectApplication: vi.fn(),
  rejectApplication: vi.fn(),
  withdrawApplication: vi.fn(),
  downloadApplicantResume: vi.fn(),
  getApplicationHistory: vi.fn(),
}));
const interviewApi = vi.hoisted(() => ({ getApplicationInterviews: vi.fn() }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: () => authState }));
vi.mock("@/services/apiApplications", () => applicationApi);
vi.mock("@/services/apiInterviews", () => interviewApi);
vi.mock("@/components/InterviewPanel", () => ({
  default: () => <div>Interview workflow</div>,
}));
import ApplicationCard from "../ApplicationCard";

const app = {
  id: "app-1",
  candidate_id: "c-1",
  resume_id: "r-1",
  status: "interview",
  applied_at: "2026-10-01T00:00:00Z",
  candidate_name: "Ava Candidate",
  candidate_email: "ava@example.test",
  resume_file_name: "ava.pdf",
  profile: { headline: "Engineer", experience_years: 4 },
};

describe("application review card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    interviewApi.getApplicationInterviews.mockResolvedValue([{ id: "i1", status: "completed" }]);
  });

  it("shows candidate details and permits the interview decision flow", async () => {
    authState.user = { id: "hr-1", role: "hr" };
    applicationApi.selectApplication.mockResolvedValue({ status: "selected" });
    render(<ApplicationCard application={app} />);
    expect(screen.getByText("Ava Candidate")).toBeTruthy();
    expect(screen.getByText("Engineer")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Select candidate" }));
    await waitFor(() =>
      expect(screen.getByText("Status: Selected")).toBeTruthy(),
    );
    expect(applicationApi.selectApplication).toHaveBeenCalledWith("app-1");
  });

  it("shows a permission/API error without losing the application status", async () => {
    authState.user = { id: "hr-1", role: "hr" };
    applicationApi.rejectApplication.mockRejectedValue(
      new Error("You do not have permission"),
    );
    render(<ApplicationCard application={app} />);
    fireEvent.click(screen.getByRole("button", { name: "Reject candidate" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "You do not have permission",
    );
    expect(screen.getByText("Status: Interview")).toBeTruthy();
  });
});
