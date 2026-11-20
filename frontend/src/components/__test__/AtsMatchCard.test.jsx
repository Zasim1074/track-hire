import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ getAtsScore: vi.fn() }));
vi.mock("@/services/apiJobs", () => api);

import AtsMatchCard from "../AtsMatchCard";

describe("AtsMatchCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an explainable score with matching and missing skills", async () => {
    api.getAtsScore.mockResolvedValue({ score: 78, label: "Good match", matched_skills: ["React", "TypeScript"], missing_skills: ["GraphQL"], matched_keywords: ["frontend"], recommendations: ["Add a quantified React achievement."], resume: { id: "resume-1", file_name: "resume.pdf" } });
    render(<MemoryRouter><AtsMatchCard jobId="job-1" /></MemoryRouter>);
    expect(await screen.findByText("Good match")).toBeInTheDocument();
    expect(screen.getByLabelText("ATS match score 78 out of 100")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("GraphQL")).toBeInTheDocument();
    expect(screen.getByText("Add a quantified React achievement.")).toBeInTheDocument();
  });

  it("offers resume upload when the candidate has no default resume", async () => {
    api.getAtsScore.mockRejectedValue(Object.assign(new Error("Resume not found"), { status: 404 }));
    render(<MemoryRouter><AtsMatchCard jobId="job-1" /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("link", { name: "Add a resume" })).toHaveAttribute("href", "/resumes"));
  });
});

