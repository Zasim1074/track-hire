import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const profileApi = vi.hoisted(() => ({
  getCandidateProfile: vi.fn(),
  createCandidateProfile: vi.fn(),
  updateCandidateProfile: vi.fn(),
}));
vi.mock("@/services/apiCandidateProfile", () => profileApi);
import CandidateProfilePage from "./CandidateProfilePage";

describe("candidate profile form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads an existing profile and saves edits", async () => {
    profileApi.getCandidateProfile.mockResolvedValue({
      headline: "Engineer",
      experience_years: 3,
      location: "Pune",
    });
    profileApi.updateCandidateProfile.mockResolvedValue({
      headline: "Senior Engineer",
      experience_years: 4,
      location: "Pune",
    });
    render(<CandidateProfilePage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Headline").value).toBe("Engineer"),
    );
    fireEvent.change(screen.getByLabelText("Headline"), {
      target: { value: "Senior Engineer" },
    });
    fireEvent.change(screen.getByLabelText("Years of experience"), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Profile saved."),
    );
    expect(profileApi.updateCandidateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        headline: "Senior Engineer",
        experience_years: 4,
      }),
    );
  });

  it("shows a load error instead of a blank form", async () => {
    profileApi.getCandidateProfile.mockRejectedValue(
      new Error("Please sign in again."),
    );
    render(<CandidateProfilePage />);
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Please sign in again.",
    );
  });
});
