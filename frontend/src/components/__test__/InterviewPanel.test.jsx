import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const interviewApi = vi.hoisted(() => ({
  getApplicationInterviews: vi.fn(),
  scheduleInterview: vi.fn(),
  updateInterview: vi.fn(),
  interviewAction: vi.fn(),
  getInterviewFeedback: vi.fn(),
  submitInterviewFeedback: vi.fn(),
}));
const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/services/apiInterviews", () => interviewApi);
vi.mock("@/auth/AuthContext", () => ({ useAuth: auth.useAuth }));

import InterviewPanel from "../InterviewPanel";

const scheduledInterview = {
  id: "interview-1",
  round_number: 1,
  interview_type: "technical",
  status: "scheduled",
  scheduled_at: "2030-01-15T11:00:00Z",
  duration_minutes: 45,
  interviewer_id: "hr-1",
  meeting_url: "https://example.test/meeting",
};
const completedInterview = { ...scheduledInterview, status: "completed" };

const renderPanel = (status = "shortlisted") =>
  render(
    <InterviewPanel
      application={{ id: "application-1", status }}
      onScheduled={vi.fn()}
    />,
  );

describe("InterviewPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.useAuth.mockReturnValue({ user: { id: "hr-1", role: "hr" } });
    interviewApi.getApplicationInterviews.mockResolvedValue([]);
    interviewApi.scheduleInterview.mockResolvedValue(scheduledInterview);
    interviewApi.updateInterview.mockResolvedValue(scheduledInterview);
    interviewApi.interviewAction.mockResolvedValue(completedInterview);
    interviewApi.getInterviewFeedback.mockRejectedValue({
      status: 404,
      message: "No feedback",
    });
    interviewApi.submitInterviewFeedback.mockResolvedValue({
      rating: 5,
      recommendation: "strong_hire",
    });
  });

  it("schedules an interview and shows its round after refresh", async () => {
    const user = userEvent.setup();
    interviewApi.getApplicationInterviews
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([scheduledInterview]);
    renderPanel();

    await screen.findByRole("button", { name: "Schedule interview" });
    fireEvent.change(screen.getByLabelText("Interview date and time"), {
      target: { value: "2030-01-15T11:00" },
    });
    await user.click(
      screen.getByRole("button", { name: "Schedule interview" }),
    );

    await waitFor(() =>
      expect(interviewApi.scheduleInterview).toHaveBeenCalledWith(
        "application-1",
        expect.objectContaining({
          interviewer_id: "hr-1",
          duration_minutes: 45,
          interview_type: "video",
        }),
      ),
    );
    expect(
      await screen.findByText(/Round 1 · technical · scheduled/),
    ).toBeInTheDocument();
  });

  it("updates the interview time and supports the no-show action", async () => {
    const user = userEvent.setup();
    interviewApi.getApplicationInterviews.mockResolvedValue([
      scheduledInterview,
    ]);
    renderPanel();

    await user.click(
      await screen.findByRole("button", { name: "Update schedule" }),
    );
    fireEvent.change(screen.getByLabelText("Updated interview date and time"), {
      target: { value: "2030-01-16T12:30" },
    });
    await user.click(screen.getByRole("button", { name: "Save schedule" }));
    await waitFor(() =>
      expect(interviewApi.updateInterview).toHaveBeenCalledWith(
        "interview-1",
        expect.objectContaining({ duration_minutes: 45 }),
      ),
    );

    await user.click(screen.getByRole("button", { name: "Mark no-show" }));
    await waitFor(() =>
      expect(interviewApi.interviewAction).toHaveBeenCalledWith(
        "interview-1",
        "no-show",
      ),
    );
  });

  it("completes an interview and submits interviewer feedback", async () => {
    const user = userEvent.setup();
    interviewApi.getApplicationInterviews
      .mockResolvedValueOnce([scheduledInterview])
      .mockResolvedValueOnce([completedInterview]);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "complete" }));
    await screen.findByRole("button", { name: "Submit feedback" });
    fireEvent.change(screen.getByRole("combobox", { name: "Recommendation" }), {
      target: { value: "strong_hire" },
    });
    await user.click(screen.getByRole("button", { name: "Submit feedback" }));

    await waitFor(() =>
      expect(interviewApi.submitInterviewFeedback).toHaveBeenCalledWith(
        "interview-1",
        expect.objectContaining({ rating: 3, recommendation: "strong_hire" }),
      ),
    );
    expect(
      await screen.findByText(/Feedback submitted: strong hire · 5\/5/),
    ).toBeInTheDocument();
  });
});
