import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const jobApi = vi.hoisted(() => ({
  getSavedJobs: vi.fn(),
  deleteJob: vi.fn(),
}));

vi.mock("@/services/apiJobs", () => jobApi);
vi.mock("@/services/useFetch", () => ({
  useFetch: (callback, options = {}) => ({
    loading: false,
    fn: (overrides = {}) => callback({ ...options, ...overrides }),
  }),
}));

import Jobcard from "./Jobcard";

const job = {
  id: "job-1",
  title: "Frontend Engineer",
  location: "Remote",
  description: "Build the TrackHire interface",
  company: { name: "TrackHire", logo_url: "https://example.com/logo.png" },
};

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <Jobcard job={job} {...props} />
    </MemoryRouter>,
  );

describe("Jobcard actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobApi.getSavedJobs.mockResolvedValue({});
    jobApi.deleteJob.mockResolvedValue(null);
  });

  it("saves and removes a job, updating its accessible label", async () => {
    const onJobSaved = vi.fn();
    renderCard({ onJobSaved });

    const saveButton = screen.getByRole("button", { name: "Save job" });
    fireEvent.click(saveButton);
    await waitFor(() => expect(jobApi.getSavedJobs).toHaveBeenCalledWith({ job_id: "job-1", alreadySaved: false }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Remove from saved" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Remove from saved" }));
    await waitFor(() => expect(jobApi.getSavedJobs).toHaveBeenLastCalledWith({ job_id: "job-1", alreadySaved: true }));
    expect(onJobSaved).toHaveBeenCalledTimes(2);
  });

  it("shows save errors and exposes a working delete button for posted jobs", async () => {
    jobApi.getSavedJobs.mockRejectedValueOnce(new Error("Please sign in again."));
    const onJobSaved = vi.fn();
    renderCard({ isMyJob: true, onJobSaved });

    fireEvent.click(screen.getByRole("button", { name: "Save job" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please sign in again.");

    fireEvent.click(screen.getByRole("button", { name: "Delete Frontend Engineer" }));
    await waitFor(() => expect(jobApi.deleteJob).toHaveBeenCalledWith({ job_id: "job-1" }));
    expect(onJobSaved).toHaveBeenCalledTimes(1);
  });
});
