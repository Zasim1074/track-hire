import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  applyToJob: vi.fn(),
  uploadResume: vi.fn(),
  deleteResume: vi.fn(),
}));
vi.mock("@/services/apiApplications", () => ({ applyToJob: api.applyToJob }));
vi.mock("@/services/apiResumes", () => ({
  uploadResume: api.uploadResume,
  deleteResume: api.deleteResume,
}));
vi.mock("./ui/drawer", async () => {
  const React = await import("react");
  return {
    Drawer: ({ children }) => <>{children}</>,
    DrawerClose: ({ children }) => children,
    DrawerContent: ({ children }) => <div role="dialog">{children}</div>,
    DrawerDescription: ({ children }) => <p>{children}</p>,
    DrawerHeader: ({ children }) => <header>{children}</header>,
    DrawerTitle: ({ children }) => <h2>{children}</h2>,
    DrawerTrigger: ({ children }) => React.Children.only(children),
  };
});

import ApplyJobDrawer from "./ApplyJobDrawer";

describe("ApplyJobDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.uploadResume.mockResolvedValue({ id: "resume-1" });
    api.applyToJob.mockResolvedValue({ id: "application-1" });
    api.deleteResume.mockResolvedValue(null);
  });

  it("uploads a resume, applies, and refreshes the job", async () => {
    const user = userEvent.setup();
    const fetchJob = vi.fn().mockResolvedValue(null);
    render(<ApplyJobDrawer dataJob={{ id: "job-1", title: "Engineer", status: "published" }} fetchJob={fetchJob} />);

    await user.click(screen.getByRole("button", { name: "Apply" }));
    await user.upload(screen.getByLabelText(/Resume/), new File(["resume"], "candidate.pdf", { type: "application/pdf" }));
    await user.type(screen.getByLabelText(/Cover letter/), "I am interested in this role.");
    await user.click(screen.getByLabelText("I confirm my application information is accurate."));
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    await waitFor(() => expect(api.uploadResume).toHaveBeenCalledWith(expect.any(File)));
    expect(api.applyToJob).toHaveBeenCalledWith({
      job_id: "job-1",
      resume_id: "resume-1",
      cover_letter: "I am interested in this role.",
    });
    expect(fetchJob).toHaveBeenCalledOnce();
    expect(api.deleteResume).not.toHaveBeenCalled();
  });

  it("validates the file and confirmation before submitting", async () => {
    const user = userEvent.setup();
    render(<ApplyJobDrawer dataJob={{ id: "job-1", title: "Engineer", status: "published" }} fetchJob={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Apply" }));
    fireEvent.change(screen.getByLabelText(/Resume/), {
      target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] },
    });
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    expect(await screen.findByText("Only PDF, DOC, or DOCX files are supported")).toBeInTheDocument();
    expect(screen.getByText("Please confirm your application information is accurate")).toBeInTheDocument();
    expect(api.uploadResume).not.toHaveBeenCalled();
  });

  it("cleans up the uploaded resume when application submission fails", async () => {
    const user = userEvent.setup();
    api.applyToJob.mockRejectedValue(new Error("You have already applied to this job."));
    render(<ApplyJobDrawer dataJob={{ id: "job-1", title: "Engineer", status: "published" }} fetchJob={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await user.upload(screen.getByLabelText(/Resume/), new File(["resume"], "candidate.pdf", { type: "application/pdf" }));
    await user.click(screen.getByLabelText("I confirm my application information is accurate."));
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You have already applied to this job.");
    expect(api.deleteResume).toHaveBeenCalledWith("resume-1");
  });
});
