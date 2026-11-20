import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  loadJobs: vi.fn().mockResolvedValue({}),
  data: { items: [{ id: "job-1", title: "Frontend Engineer" }], total: 1, page: 1, total_pages: 1 },
}));

vi.mock("@/services/useFetch", () => ({ useFetch: () => ({ fn: state.loadJobs, data: state.data, loading: false, error: null }) }));
vi.mock("@/components/Jobcard", () => ({ default: ({ job }) => <article>{job.title}</article> }));

import JobListing from "../JobListing";

describe("JobListing search experience", () => {
  beforeEach(() => state.loadJobs.mockClear());

  it("keeps keyword and location in the primary search and sends both to the API", async () => {
    render(<MemoryRouter><JobListing /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText("Job title, skill, or company"), { target: { value: "React" } });
    fireEvent.change(screen.getByPlaceholderText("City, state, or remote"), { target: { value: "Bengaluru" } });
    fireEvent.click(screen.getByRole("button", { name: "Search jobs" }));
    await waitFor(() => expect(state.loadJobs).toHaveBeenLastCalledWith(expect.objectContaining({ searchQuery: "React", location: "Bengaluru", page: 1 })));
  });

  it("applies right-rail filters without dropping the active search", async () => {
    render(<MemoryRouter><JobListing /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText("Job title, skill, or company"), { target: { value: "Engineer" } });
    fireEvent.click(screen.getByRole("button", { name: "Search jobs" }));
    fireEvent.change(screen.getByLabelText("Work mode filter"), { target: { value: "remote" } });
    fireEvent.change(screen.getByLabelText("Experience filter"), { target: { value: "senior" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() => expect(state.loadJobs).toHaveBeenLastCalledWith(expect.objectContaining({ searchQuery: "Engineer", work_mode: "remote", experience_level: "senior" })));
    expect(screen.getByRole("complementary", { name: "Job filters" })).toBeInTheDocument();
  });
});

