import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const resumeApi = vi.hoisted(() => ({
  getMyResumes: vi.fn(),
  uploadResume: vi.fn(),
  deleteResume: vi.fn(),
  setDefaultResume: vi.fn(),
  downloadResume: vi.fn(),
}));
vi.mock("@/services/apiResumes", () => resumeApi);
import ResumesPage from "./ResumesPage";

describe("resume management screen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads a valid resume and renders the returned metadata", async () => {
    resumeApi.getMyResumes
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          id: "resume-1",
          file_name: "cv.pdf",
          is_default: true,
          created_at: "2026-10-01T00:00:00Z",
        },
      ]);
    resumeApi.uploadResume.mockResolvedValue({ id: "resume-1" });
    render(<ResumesPage />);
    await screen.findByText("No resumes uploaded yet.");
    const file = new File(["resume"], "cv.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText("Resume file");
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file],
    });
    fireEvent.change(input);
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => expect(screen.getByText(/cv.pdf/)).toBeTruthy());
    expect(resumeApi.uploadResume).toHaveBeenCalledWith(file);
  });

  it("rejects unsupported files before calling the API", async () => {
    resumeApi.getMyResumes.mockResolvedValue([]);
    render(<ResumesPage />);
    const file = new File(["image"], "photo.png", { type: "image/png" });
    const input = await screen.findByLabelText("Resume file");
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file],
    });
    fireEvent.change(input);
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(resumeApi.uploadResume).not.toHaveBeenCalled();
  });
});
