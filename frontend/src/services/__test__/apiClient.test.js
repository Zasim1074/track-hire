import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, getAccessToken, setAccessToken } from "../apiClient";
import { login } from "../apiAuth";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("FastAPI client", () => {
  it("sends bearer token and parses JSON responses", async () => {
    setAccessToken("jwt-value");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ id: "1" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    );

    await expect(apiRequest("/users/me", { auth: true })).resolves.toEqual({
      id: "1",
    });
    expect(fetch.mock.calls[0][1].headers.get("Authorization")).toBe(
      "Bearer jwt-value",
    );
  });

  it("clears invalid tokens and returns a useful 401 error", async () => {
    setAccessToken("expired");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ detail: "Invalid credentials" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    );

    await expect(apiRequest("/users/me", { auth: true })).rejects.toMatchObject(
      { status: 401, message: "Invalid credentials" },
    );
    expect(getAccessToken()).toBeNull();
  });

  it("persists the FastAPI login token", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              token: { access_token: "new-token" },
              user: { id: "u1" },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
    );

    await login({ email: "a@example.com", password: "secret" });
    expect(getAccessToken()).toBe("new-token");
  });

  it("does not set a JSON content type for multipart uploads", async () => {
    const body = new FormData();
    body.append("file", new Blob(["resume"]), "resume.pdf");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ id: "r1" }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    );

    await apiRequest("/resumes", { method: "POST", body, auth: true });
    expect(fetch.mock.calls[0][1].headers.has("Content-Type")).toBe(false);
  });

  it("shares in-flight GET requests but does not cache completed responses", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([apiRequest("/jobs"), apiRequest("/jobs")]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await apiRequest("/jobs");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
