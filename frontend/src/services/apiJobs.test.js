import { afterEach, describe, expect, it, vi } from "vitest";
import { getJobs } from "./apiJobs";

afterEach(() => vi.unstubAllGlobals());

describe("job listing API adapter", () => {
  it("passes search to the API and filters company UUIDs from the select string", async () => {
    const companyId = "f7f10b2d-2357-41e3-b04f-fd33a62897a4";
    const jobs = [
      { id: "1", company_id: companyId, location: "New York" },
      { id: "2", company_id: "other-company", location: "New York" },
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: jobs, total_pages: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getJobs({ company: companyId, location: "new york", searchQuery: "engineer" }),
    ).resolves.toEqual([jobs[0]]);
    expect(fetchMock.mock.calls[0][0]).toContain("search=engineer");
  });

  it("loads all pages before applying client-side filters", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: 1, location: "Remote" }], total_pages: 2 }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: 2, location: "Hybrid" }], total_pages: 2 }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getJobs({ location: "hybrid" })).resolves.toEqual([
      { id: 2, location: "Hybrid" },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("page=2");
  });
});
