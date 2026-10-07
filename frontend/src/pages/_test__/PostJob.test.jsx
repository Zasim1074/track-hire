import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const jobApi = vi.hoisted(() => ({
  getSingleJob: vi.fn(),
  postNewJob: vi.fn(),
  updateJob: vi.fn(),
}));
const companyApi = vi.hoisted(() => ({ getMyCompany: vi.fn() }));
const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/services/apiJobs", () => jobApi);
vi.mock("@/services/apiCompanies", () => companyApi);
vi.mock("@/auth/AuthContext", () => ({ useAuth: auth.useAuth }));
vi.mock("@/components/CompanySetupForm", () => ({ default: () => <p>COMPANY_SETUP_FORM</p> }));

import PostJob from "../PostJob";

const longDescription = "Build reliable APIs and work closely with product and design teams. ".repeat(4);
const job = {
  id: "job-1",
  title: "Backend Engineer",
  description: longDescription,
  location: "Remote",
  work_mode: "remote",
  employment_type: "full_time",
  experience_level: "mid",
  company_id: "company-1",
  min_experience: 4,
  max_experience: 7,
  min_salary: 100000,
  max_salary: 140000,
  skills: ["Python"],
  status: "published",
  is_active: true,
};

function CurrentLocation() {
  const location = useLocation();
  return <output aria-label="Current route">{location.pathname}</output>;
}

describe("PostJob edit flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.useAuth.mockReturnValue({ user: { id: "hr-1", role: "hr" }, loading: false });
    companyApi.getMyCompany.mockResolvedValue({ id: "company-1", name: "TrackHire" });
    jobApi.getSingleJob.mockResolvedValue(job);
    jobApi.updateJob.mockResolvedValue({ ...job, title: "Updated Engineer" });
  });

  it("preloads an existing job, saves edits, and returns to My Jobs", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/post-job?job_id=job-1"]}>
        <Routes>
          <Route path="/post-job" element={<PostJob />} />
          <Route path="*" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    const title = await screen.findByPlaceholderText("Job Title");
    await waitFor(() => expect(title).toHaveValue("Backend Engineer"));
    expect(screen.getByText(/Posting for/)).toHaveTextContent("TrackHire");
    expect(screen.queryByText(/Select Company/)).not.toBeInTheDocument();
    await user.clear(title);
    await user.type(title, "Updated Engineer");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(jobApi.updateJob).toHaveBeenCalledWith(expect.objectContaining({
      job_id: "job-1",
      title: "Updated Engineer",
      min_salary: 100000,
      max_salary: 140000,
      status: "published",
      is_active: true,
    })));
    expect(await screen.findByLabelText("Current route")).toHaveTextContent("/my-jobs");
  });

  it("shows company setup when HR has no company membership", async () => {
    companyApi.getMyCompany.mockResolvedValue(null);
    render(
      <MemoryRouter initialEntries={["/post-job"]}>
        <Routes><Route path="/post-job" element={<PostJob />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("COMPANY_SETUP_FORM")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Post job" })).not.toBeInTheDocument();
  });

  it("creates a job using backend field names without sending a company id", async () => {
    const user = userEvent.setup();
    jobApi.postNewJob.mockResolvedValue({ id: "new-job" });
    render(
      <MemoryRouter initialEntries={["/post-job"]}>
        <Routes>
          <Route path="/post-job" element={<PostJob />} />
          <Route path="*" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(await screen.findByPlaceholderText("Job Title"), "API Engineer");
    await user.type(screen.getByPlaceholderText("Job Description"), longDescription);
    await user.type(screen.getByPlaceholderText("Location"), "Remote");
    await user.click(screen.getByRole("button", { name: "Post job" }));

    await waitFor(() => expect(jobApi.postNewJob).toHaveBeenCalledOnce());
    const payload = jobApi.postNewJob.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: "API Engineer",
      location: "Remote",
      work_mode: "onsite",
      employment_type: "full_time",
      experience_level: "entry",
      min_experience: 0,
      max_experience: null,
      min_salary: null,
      max_salary: null,
      skills: [],
      status: "published",
    });
    expect(payload).not.toHaveProperty("company_id");
  });
});
